import * as cheerio from 'cheerio'
import { fetchHTML } from './fetcher'
import type { StreamingSource } from '@/types'

// Animasu (animasu.cc → redirects to the current v-domain) is a second anime
// source used when otakudesu doesn't carry a title. It is server-rendered with
// no Cloudflare challenge, and its episode pages expose a <select class="mirror">
// whose <option value> is a base64-encoded iframe embed tagged by quality
// (480p / 720p / 1080p) — giving native quality selection.

const ANIMASU_BASE = 'https://animasu.cc'

const STOP = new Set([
  'the', 'a', 'no', 'ni', 'wa', 'to', 'de', 'na', 'ga', 'season',
  '2nd', '3rd', 'part', 'and', 'of', 'sub', 'indo', 'nonton',
])

function tokenize(s: string): string[] {
  const out: string[] = []
  s.replace(/\(episode.*?\)/gi, ' ')
    .replace(/subtitle indonesia|sub indo/gi, ' ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .toLowerCase()
    .split(/\s+/)
    .forEach((t) => {
      if (t && t.length > 1 && !STOP.has(t) && out.indexOf(t) === -1) out.push(t)
    })
  return out
}

interface Result { title: string; url: string }

async function searchAnimasu(query: string): Promise<Result[]> {
  const html = await fetchHTML(`${ANIMASU_BASE}/?s=${encodeURIComponent(query)}`, { solver: true })
  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const results: Result[] = []
  $('a[href*="/anime/"]').each((_, el) => {
    const url = $(el).attr('href') || ''
    const title = ($(el).attr('title') || $(el).text() || '').trim()
    if (!/\/anime\//.test(url) || !title || seen.has(url)) return
    seen.add(url)
    results.push({ title, url })
  })
  return results
}

// Best-matching animasu anime URL for a set of candidate titles, or null.
async function matchAnimasu(titles: string[]): Promise<string | null> {
  const query: string[] = []
  titles.forEach((t) => {
    if (t) tokenize(t).forEach((tok) => { if (query.indexOf(tok) === -1) query.push(tok) })
  })
  if (query.length === 0) return null

  // Search using the most complete title (usually the romaji/original).
  const primary = titles.find(Boolean) || ''
  let results = await searchAnimasu(primary)
  if (results.length === 0 && titles[1]) results = await searchAnimasu(titles[1]!)
  if (results.length === 0) return null

  let best: Result | null = null
  let bestScore = 0
  let bestShared = 0
  let bestSize = 0
  for (const r of results) {
    const tk = tokenize(r.title)
    if (tk.length === 0) continue
    let shared = 0
    tk.forEach((t) => { if (query.indexOf(t) !== -1) shared++ })
    if (shared === 0) continue
    // Prefer titles that don't carry extra tokens (avoids spin-offs/movies
    // beating the base series), and hard-boost an exact token-set match.
    let score = shared / tk.length + shared / query.length
    if (shared === tk.length && shared === query.length) score += 10
    if (score > bestScore) {
      bestScore = score; best = r; bestShared = shared; bestSize = tk.length
    }
  }
  const confident =
    best !== null && bestScore >= 1.0 &&
    (bestShared >= 2 || (bestShared >= 1 && bestSize <= 2))
  return confident ? best!.url : null
}

async function getAnimasuEpisodes(animeUrl: string): Promise<Array<{ num: number; url: string }>> {
  const html = await fetchHTML(animeUrl, { solver: true })
  const $ = cheerio.load(html)
  const seen = new Set<number>()
  const eps: Array<{ num: number; url: string }> = []
  $('a[href*="episode-"]').each((_, el) => {
    const url = $(el).attr('href') || ''
    const m = url.match(/episode-(\d+)/)
    if (!m || !/\/nonton-/.test(url)) return
    const num = parseInt(m[1], 10)
    if (seen.has(num)) return
    seen.add(num)
    eps.push({ num, url })
  })
  return eps
}

function decodeMirror(value: string): string {
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf-8')
    const m = decoded.match(/src=["']?([^"'>\s]+)/i)
    return m ? m[1] : ''
  } catch {
    return ''
  }
}

export async function getAnimasuSources(episodeUrl: string): Promise<StreamingSource[]> {
  const html = await fetchHTML(episodeUrl, { solver: true })
  const $ = cheerio.load(html)
  const sources: StreamingSource[] = []
  const seen = new Set<string>()

  $('select.mirror option').each((i, el) => {
    const label = $(el).text().trim()
    const value = $(el).attr('value') || ''
    if (!value) return
    const src = decodeMirror(value)
    if (!src || seen.has(src) || !/^https?:/i.test(src)) return
    seen.add(src)
    const quality = label.match(/(\d{3,4}p)/)?.[1] || 'HD'
    sources.push({ label: label || `Server ${i}`, quality, server: sources.length + 1, src })
  })

  // Fallback: the default embedded player iframe.
  if (sources.length === 0) {
    const iframe = $('#pembed iframe, .video-content iframe').first().attr('src') ||
      $('iframe[src*="blogger"], iframe[src*="/embed"]').first().attr('src') || ''
    if (iframe) sources.push({ label: 'Default', quality: 'HD', server: 1, src: iframe })
  }

  return sources
}

// Full pipeline: resolve streaming sources for an anime (by candidate titles)
// and episode number from animasu. Returns [] if not found.
export async function getAnimasuEpisodeSources(
  titles: string[],
  episodeNum: number
): Promise<StreamingSource[]> {
  const animeUrl = await matchAnimasu(titles)
  if (!animeUrl) return []
  const episodes = await getAnimasuEpisodes(animeUrl)
  const target = episodes.find((e) => e.num === episodeNum)
  if (!target) return []
  return getAnimasuSources(target.url)
}
