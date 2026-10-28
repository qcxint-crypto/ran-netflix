import { cacheGet, cacheSet } from './cache'
import {
  canonicalMatches,
  parseCanonical,
  parseGogoEmbed,
  parseGogoSearch,
  parseGogoSeries,
  type GogoEpisodeRef,
  type GogoSearchResult,
  type GogoSeries,
} from './parsers/gogo'

// Gogoanime mirror client. The domain rotates, so the base always comes from
// GOGO_BASE_URL; the fallback below is only for local runs with no env.
//
// Recovered originally from "Anime X Nonton.apk", whose own CDN (gogo-stream.com)
// is NXDOMAIN. Endpoints as they are served today:
//   search   GET {base}/?s={query}
//   series   GET {base}/series/{slug}/          (paginated with ?ep_page=N)
//   episode  GET {base}/{slug}-episode-{N}-english-subbed/
//
// Note the search form advertises `?s={query}` via its JSON-LD SearchAction, and
// a bare `/search/{query}/` path also resolves but renders "Not Found" — use `?s=`.

const DEFAULT_BASE = 'https://gogoanime.fi'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const FETCH_TIMEOUT = 12000
// Hard ceiling for one call including the redirect hop, so a slow mirror cannot
// outlive the route budget. Callers bound this again from the outside.
const TOTAL_BUDGET = 15000

const TTL = {
  SEARCH: 10 * 60 * 1000,
  SERIES: 30 * 60 * 1000,
  EPISODE: 30 * 60 * 1000,
}

export function gogoBase(): string {
  return (process.env.GOGO_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '')
}

interface FetchResult {
  html: string
  finalUrl: string
}

/**
 * GET with the browser UA the mirror requires. Never throws — returns null on
 * any failure so a dead mirror degrades to "no source" instead of a 500.
 */
async function fetchPage(url: string): Promise<FetchResult | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.min(FETCH_TIMEOUT, TOTAL_BUDGET))
  const started = Date.now()
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const html = await res.text()
    if (Date.now() - started > TOTAL_BUDGET) return null
    return { html, finalUrl: res.url || url }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function searchGogo(query: string): Promise<GogoSearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const key = `gogo:search:${q.toLowerCase()}`
  const cached = cacheGet<GogoSearchResult[]>(key)
  if (cached) return cached

  const res = await fetchPage(`${gogoBase()}/?s=${encodeURIComponent(q)}`)
  if (!res) return []

  const results = parseGogoSearch(res.html, gogoBase())
  if (results.length > 0) cacheSet(key, results, TTL.SEARCH)
  return results
}

// Episode pages are walked in small batches. A long-running show is ~99 pages
// (One Piece), and firing all of them at once is both abusive to the mirror and
// slower than a bounded walk.
const PAGE_BATCH = 6

// Ceiling on the whole page walk. A nonexistent episode number can only be ruled
// out by exhausting every page (54s for One Piece), which overruns the route
// budget and gets killed rather than answering. Stopping early is safe: the
// caller falls back to the constructed `{slug}-episode-{n}-english-subbed/` URL,
// which is exact for the common case and costs one request.
const WALK_BUDGET = 14000

/**
 * Series + episode list. Pages carry ~12 episodes each and page 1 holds the
 * *latest* ones, so resolving a recent episode needs one request while episode 1
 * of a long show needs the whole walk.
 *
 * Pass `wantEp` to stop as soon as that episode turns up. A partial walk is
 * never cached — a truncated episode list would silently hide later episodes
 * from every subsequent caller.
 */
export async function getGogoSeries(slug: string, wantEp?: number): Promise<GogoSeries | null> {
  const clean = slug.trim().replace(/^\/+|\/+$/g, '')
  if (!clean) return null

  const key = `gogo:series:${clean}`
  const cached = cacheGet<GogoSeries>(key)
  if (cached) return cached

  const base = gogoBase()
  const first = await fetchPage(`${base}/series/${clean}/`)
  if (!first) return null

  // A bad series slug 301s to the homepage, so the parsed title would be the
  // site name; treat a canonical mismatch as "no such series".
  if (!canonicalMatches(parseCanonical(first.html), `${base}/series/${clean}/`)) return null

  const head = parseGogoSeries(first.html, base, clean)
  if (head.episodes.length === 0 && head.totalPages <= 1) return null

  const byNumber = new Map<number, GogoEpisodeRef>()
  for (const ep of head.episodes) byNumber.set(ep.number, ep)

  let complete = true
  if (head.totalPages > 1) {
    const pages = Array.from({ length: head.totalPages - 1 }, (_, i) => i + 2)
    const deadline = Date.now() + WALK_BUDGET
    for (let i = 0; i < pages.length; i += PAGE_BATCH) {
      if (wantEp !== undefined && byNumber.has(wantEp)) {
        complete = false
        break
      }
      if (Date.now() > deadline) {
        complete = false
        break
      }
      const batch = pages.slice(i, i + PAGE_BATCH)
      const results = await Promise.all(
        batch.map((p) => fetchPage(`${base}/series/${clean}/?ep_page=${p}`))
      )
      for (const page of results) {
        if (!page) continue
        for (const ep of parseGogoSeries(page.html, base, clean).episodes) {
          if (!byNumber.has(ep.number)) byNumber.set(ep.number, ep)
        }
      }
    }
  }

  const series: GogoSeries = {
    title: head.title,
    episodes: Array.from(byNumber.values()).sort((a, b) => a.number - b.number),
    totalPages: head.totalPages,
  }
  if (complete) cacheSet(key, series, TTL.SERIES)
  return series
}

export interface GogoEpisode {
  embedUrl: string
  pageUrl: string
}

/** Resolve the playable embed for one episode of a series. */
export async function getGogoEpisode(slug: string, ep: number): Promise<GogoEpisode | null> {
  const clean = slug.trim().replace(/^\/+|\/+$/g, '')
  if (!clean || !Number.isFinite(ep) || ep < 1) return null

  const key = `gogo:episode:${clean}:${ep}`
  const cached = cacheGet<GogoEpisode>(key)
  if (cached) return cached

  // Episode slugs are not always `{series}-episode-{n}`: spin-off sub-seasons
  // carry their own suffix (e.g. `jujutsu-kaisen-the-culling-game-part-1-...`),
  // so prefer the URL harvested from the series page and only fall back to the
  // constructed pattern when that lookup is unavailable.
  const series = await getGogoSeries(clean, ep)
  const match = series?.episodes.find((e) => e.number === ep)
  const candidates = [
    match?.url,
    `${gogoBase()}/${clean}-episode-${ep}-english-subbed/`,
  ].filter(Boolean) as string[]

  for (const url of candidates) {
    const page = await fetchPage(url)
    if (!page) continue
    if (!canonicalMatches(parseCanonical(page.html), url)) continue
    const embedUrl = parseGogoEmbed(page.html)
    if (!embedUrl) continue
    const result: GogoEpisode = { embedUrl, pageUrl: url }
    cacheSet(key, result, TTL.EPISODE)
    return result
  }

  return null
}

// --- Title matching (shared by the episode pipeline) -------------------------

const STOP = new Set([
  'the', 'a', 'no', 'ni', 'wa', 'to', 'de', 'na', 'ga', 'season',
  '2nd', '3rd', 'part', 'and', 'of', 'sub', 'indo', 'nonton', 'episode',
])

function tokenize(s: string): string[] {
  const out: string[] = []
  s.replace(/\(episode.*?\)/gi, ' ')
    .replace(/subtitle indonesia|sub indo|english subbed|subbed|dubbed/gi, ' ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .toLowerCase()
    .split(/\s+/)
    .forEach((t) => {
      if (t && t.length > 1 && !STOP.has(t) && out.indexOf(t) === -1) out.push(t)
    })
  return out
}

/**
 * Best gogo series slug for a set of candidate titles, or null when no match
 * clears the confidence bar (so we fall back rather than play the wrong show).
 */
export async function matchGogoSeries(titles: string[]): Promise<string | null> {
  const query: string[] = []
  titles.forEach((t) => {
    if (t) tokenize(t).forEach((tok) => { if (query.indexOf(tok) === -1) query.push(tok) })
  })
  if (query.length === 0) return null

  const primary = titles.find(Boolean) || ''
  let results = await searchGogo(primary)
  if (results.length === 0 && titles[1]) results = await searchGogo(titles[1]!)
  if (results.length === 0) return null

  let best: GogoSearchResult | null = null
  let bestScore = 0
  let bestShared = 0
  let bestSize = 0

  for (const r of results) {
    const tk = tokenize(r.title)
    if (tk.length === 0) continue
    let shared = 0
    tk.forEach((t) => { if (query.indexOf(t) !== -1) shared++ })
    if (shared === 0) continue
    // Prefer titles without extra tokens (keeps spin-offs from beating the base
    // series) and hard-boost an exact token-set match.
    let score = shared / tk.length + shared / query.length
    if (shared === tk.length && shared === query.length) score += 10
    if (score > bestScore) {
      bestScore = score; best = r; bestShared = shared; bestSize = tk.length
    }
  }

  const confident =
    best !== null && bestScore >= 1.0 &&
    (bestShared >= 2 || (bestShared >= 1 && bestSize <= 2))
  return confident ? best!.slug : null
}
