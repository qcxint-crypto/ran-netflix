import { cacheGet, cacheSet } from './cache'

// MyAnimeList API v2 client. The client ID comes from MAL_CLIENT_ID (recovered
// for research from the official MyAnimeList.apk resources.arsc) and is never
// inlined here. Without it every call returns [] so the UI simply drops the row.
//
// Endpoint note: `/anime/season/now` — the path the docs advertise — answers 404
// on API v2. The working form is `/anime/season/{year}/{season}`, which needs the
// season computed client-side.

const API = 'https://api.myanimelist.net/v2'
const FETCH_TIMEOUT = 8000
const TOTAL_BUDGET = 8000

const FIELDS = 'title,mean,main_picture,num_episodes,genres,media_type,start_season'

const TTL = {
  RANKING: 60 * 60 * 1000,
  SEASON: 30 * 60 * 1000,
  SEARCH: 10 * 60 * 1000,
}

export interface MalAnime {
  id: number
  title: string
  image?: string
  score?: number
  episodes?: number
  genres?: string[]
  type?: string
}

interface MalNode {
  id: number
  title?: string
  mean?: number
  num_episodes?: number
  main_picture?: { medium?: string; large?: string }
  genres?: Array<{ id: number; name: string }>
  media_type?: string
}

interface MalListResponse {
  data?: Array<{ node: MalNode }>
}

interface MalSearchResponse {
  data?: Array<{ node: MalNode }>
}

export function malConfigured(): boolean {
  return Boolean(process.env.MAL_CLIENT_ID)
}

function toAnime(node: MalNode): MalAnime {
  return {
    id: node.id,
    title: node.title || 'Unknown',
    image: node.main_picture?.large || node.main_picture?.medium || undefined,
    score: node.mean && node.mean > 0 ? node.mean : undefined,
    episodes: node.num_episodes && node.num_episodes > 0 ? node.num_episodes : undefined,
    genres: node.genres?.map((g) => g.name),
    type: node.media_type || undefined,
  }
}

async function malFetch<T>(path: string): Promise<T | null> {
  const clientId = process.env.MAL_CLIENT_ID
  if (!clientId) return null

  const separator = path.includes('?') ? '&' : '?'
  const url = `${API}${path}${separator}fields=${FIELDS}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.min(FETCH_TIMEOUT, TOTAL_BUDGET))
  try {
    const res = await fetch(url, {
      headers: {
        'X-MAL-CLIENT-ID': clientId,
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 12
  return Math.min(Math.max(Math.floor(limit), 1), 100)
}

/** Top-ranked anime of all time. */
export async function malTopAnime(limit = 12): Promise<MalAnime[]> {
  const n = clampLimit(limit)
  const key = `mal:top:${n}`
  const cached = cacheGet<MalAnime[]>(key)
  if (cached) return cached

  const data = await malFetch<MalListResponse>(`/anime/ranking?ranking_type=all&limit=${n}`)
  const result = (data?.data ?? []).map((item) => toAnime(item.node))
  if (result.length > 0) cacheSet(key, result, TTL.RANKING)
  return result
}

const SEASONS = ['winter', 'spring', 'summer', 'fall'] as const

/** Current broadcast season. Mirrors MAL's own calendar split, not the equinox. */
function currentSeason(now = new Date()): { year: number; season: string } {
  const month = now.getUTCMonth() // 0-11
  const year = now.getUTCFullYear()
  // Winter: Jan-Mar, Spring: Apr-Jun, Summer: Jul-Sep, Fall: Oct-Dec.
  const index = Math.min(3, Math.floor(month / 3))
  return { year, season: SEASONS[index]! }
}

/** Anime airing in the current season. */
export async function malSeasonNow(limit = 12): Promise<MalAnime[]> {
  const n = clampLimit(limit)
  const { year, season } = currentSeason()
  const key = `mal:season:${year}:${season}:${n}`
  const cached = cacheGet<MalAnime[]>(key)
  if (cached) return cached

  const data = await malFetch<MalListResponse>(`/anime/season/${year}/${season}?limit=${n}`)
  const result = (data?.data ?? []).map((item) => toAnime(item.node))
  if (result.length > 0) cacheSet(key, result, TTL.SEASON)
  return result
}

/** Single entry by MAL id, for the score badge on the anime detail page. */
export async function malAnimeById(id: number): Promise<MalAnime | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  const key = `mal:anime:${id}`
  const cached = cacheGet<MalAnime>(key)
  if (cached) return cached

  const data = await malFetch<MalNode>(`/anime/${id}`)
  if (!data || !data.id) return null
  const result = toAnime(data)
  cacheSet(key, result, TTL.RANKING)
  return result
}

/** Title search, used to cross-reference a gogo/AniList title back to a MAL id. */
export async function malSearchAnime(query: string, limit = 10): Promise<MalAnime[]> {
  const q = query.trim()
  if (!q) return []
  const n = clampLimit(limit)
  const key = `mal:search:${q.toLowerCase()}:${n}`
  const cached = cacheGet<MalAnime[]>(key)
  if (cached) return cached

  const data = await malFetch<MalSearchResponse>(`/anime?q=${encodeURIComponent(q)}&limit=${n}`)
  const result = (data?.data ?? []).map((item) => toAnime(item.node))
  if (result.length > 0) cacheSet(key, result, TTL.SEARCH)
  return result
}

export function malAnimeUrl(id: number): string {
  return `https://myanimelist.net/anime/${id}`
}
