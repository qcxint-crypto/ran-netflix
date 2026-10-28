import * as cheerio from 'cheerio'
import { fetchHTML, postAjax } from './fetcher'
import { BASE_URL, USER_AGENT } from './config'
import { extractSlug } from '@/lib/utils'
import { cacheGet, cacheGetStale, cacheSet } from './cache'
import type { StreamingSource } from '@/types'

const DEAD_PATH_RE = /\/maintenance(\/|$|\?)/i

function isDeadUrl(url: string): boolean {
  return !url || DEAD_PATH_RE.test(url)
}

// --- Anime-list index + fuzzy matcher ---------------------------------------
// otakudesu's ?s= search does loose synopsis matching and frequently misses a
// title even when the site carries it (and MAL titles rarely equal otakudesu's
// romaji names). Instead we index the full /anime-list/ once and fuzzy-match
// the anime's MAL titles/synonyms against it. This resolves far more titles.

const ANIME_INDEX_KEY = 'otakudesu:anime-index'
const ANIME_INDEX_TTL = 6 * 60 * 60 * 1000 // 6h

interface AnimeIndexEntry {
  title: string
  url: string
}

const STOP = new Set([
  'the', 'a', 'no', 'ni', 'wa', 'to', 'de', 'na', 'ga', 'season',
  '2nd', '3rd', 'part', 'and', 'of', 'sub', 'indo',
])

function normalizeTitle(s: string): string {
  return s
    .replace(/\(episode.*?\)/gi, ' ')
    .replace(/subtitle indonesia|sub indo|\bbd\b/gi, ' ')
    .replace(/&#8211;|&#8217;|&amp;/gi, ' ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .toLowerCase()
    .trim()
}

function tokenize(s: string): string[] {
  const out: string[] = []
  normalizeTitle(s)
    .split(/\s+/)
    .forEach((t) => {
      if (t && t.length > 1 && !STOP.has(t) && out.indexOf(t) === -1) out.push(t)
    })
  return out
}

async function getAnimeIndex(): Promise<AnimeIndexEntry[]> {
  const cached = cacheGet<AnimeIndexEntry[]>(ANIME_INDEX_KEY)
  if (cached) return cached
  try {
    const html = await fetchHTML(`${BASE_URL}/anime-list/`)
    const $ = cheerio.load(html)
    const entries: AnimeIndexEntry[] = []
    $('a.hodebgst').each((_, el) => {
      const url = $(el).attr('href') || ''
      const title = $(el).attr('title') || $(el).text().trim()
      if (url.includes('/anime/') && title) entries.push({ title, url })
    })
    if (entries.length > 0) {
      cacheSet(ANIME_INDEX_KEY, entries, ANIME_INDEX_TTL)
      return entries
    }
    const stale = cacheGetStale<AnimeIndexEntry[]>(ANIME_INDEX_KEY)
    return stale || []
  } catch {
    const stale = cacheGetStale<AnimeIndexEntry[]>(ANIME_INDEX_KEY)
    return stale || []
  }
}

// Best otakudesu anime URL for a set of candidate titles, or null if no
// confident match (so callers can fall back instead of playing wrong content).
export async function matchAnimeByTitles(titles: string[]): Promise<string | null> {
  const query: string[] = []
  titles.forEach((t) => {
    if (t) tokenize(t).forEach((tok) => { if (query.indexOf(tok) === -1) query.push(tok) })
  })
  if (query.length === 0) return null

  const index = await getAnimeIndex()
  if (index.length === 0) return null

  let best: AnimeIndexEntry | null = null
  let bestScore = 0
  let bestShared = 0
  let bestSize = 0
  for (const entry of index) {
    const tk = tokenize(entry.title)
    if (tk.length === 0) continue
    let shared = 0
    tk.forEach((t) => { if (query.indexOf(t) !== -1) shared++ })
    if (shared === 0) continue
    const score = shared / tk.length + shared / query.length
    if (score > bestScore) {
      bestScore = score
      best = entry
      bestShared = shared
      bestSize = tk.length
    }
  }

  const confident =
    best !== null &&
    bestScore >= 1.0 &&
    (bestShared >= 2 || (bestShared >= 1 && bestSize <= 2))
  return confident ? best!.url : null
}

async function resolveNonce(nonceAction: string): Promise<string | null> {
  try {
    const ajaxUrl = `${BASE_URL}/wp-admin/admin-ajax.php`
    const res = await postAjax(ajaxUrl, { action: nonceAction })
    const json = JSON.parse(res)
    return json.data || null
  } catch {
    return null
  }
}

async function resolveMirror(
  embedAction: string,
  nonce: string,
  dataContent: string,
  quality: string,
  serverName: string,
  serverIdx: number
): Promise<StreamingSource | null> {
  try {
    const decoded = Buffer.from(dataContent, 'base64').toString('utf-8')
    const params = JSON.parse(decoded)
    const ajaxUrl = `${BASE_URL}/wp-admin/admin-ajax.php`

    const res = await postAjax(ajaxUrl, {
      action: embedAction,
      nonce,
      id: String(params.id),
      i: String(params.i),
      q: String(params.q),
    })
    const json = JSON.parse(res)
    if (!json.data) return null

    const iframeHtml = Buffer.from(json.data, 'base64').toString('utf-8')
    const $iframe = cheerio.load(iframeHtml)
    const src = $iframe('iframe').attr('src') || ''
    if (!src) return null

    return {
      // Provider name rides in the label so the merged selector shows where a
      // server comes from (quality is already its own grouping dimension).
      label: `${serverName} - Otakudesu`,
      quality,
      server: serverIdx + 1,
      src,
    }
  } catch {
    return null
  }
}

export async function searchOtakuDesu(query: string): Promise<Array<{ title: string; slug: string; url: string }>> {
  try {
    const html = await fetchHTML(`${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`)
    const $ = cheerio.load(html)
    const results: Array<{ title: string; slug: string; url: string }> = []

    $('ul.chivsrc li').each((_, el) => {
      const link = $(el).find('h2 a').attr('href') || ''
      const title = $(el).find('h2 a').text().trim()
      if (title && link) {
        results.push({ title, slug: extractSlug(link), url: link })
      }
    })

    return results
  } catch {
    return []
  }
}

export async function getOtakuDesuEpisodes(animeUrl: string): Promise<Array<{ title: string; slug: string; url: string }>> {
  try {
    const html = await fetchHTML(animeUrl)
    const $ = cheerio.load(html)
    const episodes: Array<{ title: string; slug: string; url: string }> = []

    $('.episodelist ul li').each((_, el) => {
      const link = $(el).find('a').attr('href') || ''
      const title = $(el).find('a').text().trim()
      if (link.includes('/episode/')) {
        episodes.push({ title, slug: extractSlug(link), url: link })
      }
    })

    return episodes
  } catch {
    return []
  }
}

export async function getStreamingSources(episodeUrl: string): Promise<StreamingSource[]> {
  try {
    const html = await fetchHTML(episodeUrl)
    const $ = cheerio.load(html)

    const srcSet = new Set<string>()
    const sources: StreamingSource[] = []

    const addSource = (label: string, quality: string, server: number, src: string) => {
      const trimmed = (src || '').trim()
      if (!trimmed || isDeadUrl(trimmed) || srcSet.has(trimmed)) return
      srcSet.add(trimmed)
      sources.push({ label, quality, server, src: trimmed })
    }

    const defaultIframeSrc = $('.responsive-embed-stream iframe').attr('src') || ''
    addSource('Default', 'default', 1, defaultIframeSrc)

    const actionSet = new Set<string>()
    const actionRegex = /action:\s*["']([a-f0-9]{32})["']/g
    let match
    while ((match = actionRegex.exec(html)) !== null) {
      actionSet.add(match[1]!)
    }
    const actions = Array.from(actionSet)
    const embedAction = actions[0] || ''
    const nonceAction = actions[1] || ''

    interface Mirror { quality: string; server: string; dataContent: string }
    const mirrors: Mirror[] = []
    $('.mirrorstream ul').each((_, ulEl) => {
      const ulText = $(ulEl).text().trim()
      const classAttr = $(ulEl).attr('class') || ''
      const quality = classAttr.match(/m(\d+p)/)?.[1] || ulText.match(/(\d+p)/)?.[1] || 'unknown'
      $(ulEl).find('li a[data-content]').each((_, aEl) => {
        mirrors.push({
          quality,
          server: $(aEl).text().trim(),
          dataContent: $(aEl).attr('data-content') || '',
        })
      })
    })

    if (mirrors.length > 0 && nonceAction && embedAction) {
      const nonce = await resolveNonce(nonceAction)
      if (nonce) {
        const resolved = await Promise.all(
          mirrors.map((m, i) => resolveMirror(embedAction, nonce, m.dataContent, m.quality, m.server, i))
        )
        resolved.forEach((s) => {
          if (!s || isDeadUrl(s.src)) return
          if (srcSet.has(s.src)) return
          srcSet.add(s.src)
          sources.push(s)
        })
      }
    }

    return dedupBySrc(sources)
  } catch {
    return []
  }
}

function dedupBySrc(list: StreamingSource[]): StreamingSource[] {
  const seen = new Set<string>()
  return list.filter((s) => {
    const k = (s.src || '').trim()
    if (!k || isDeadUrl(k) || seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export async function findEpisodeUrl(animeTitle: string, episodeNum: number): Promise<string | null> {
  const results = await searchOtakuDesu(animeTitle)
  if (results.length === 0) return null

  const animeResult = results[0]
  const episodes = await getOtakuDesuEpisodes(animeResult.url)

  const target = episodes.find(ep => {
    const numMatch = ep.title.match(/episode\s*(\d+)/i)
    return numMatch && parseInt(numMatch[1], 10) === episodeNum
  })

  return target?.url || null
}
