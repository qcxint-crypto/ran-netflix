// CineRoom (movie-selfhosted.vercel.app) catalogue client.
//
// Scope: PUBLIC catalogue metadata only — movies, series, seasons, episodes,
// genres, search. Playback on CineRoom is deliberately gated behind a
// session flow (gate token -> timed unlock -> same-origin claim -> signed HLS
// bound to their site) to prevent hotlinking. This client intentionally does
// NOT automate that gate; episode links open on the CineRoom site itself.
//
// Public API surface (from their SPA bundle, client-0LFNYreG.js):
//   GET /api/homepage                     -> { above: Row[], below: Row[] }
//   GET /api/movies?page&limit&genre&...  -> { data: Movie[], pagination }
//   GET /api/series?page&limit&...        -> { data: Series[], pagination }
//   GET /api/movies/:slug                 -> Movie detail
//   GET /api/series/:slug                 -> Series detail (with seasons)
//   GET /api/series/:slug/season/:n       -> { series, season: { episodes } }
//   GET /api/genres                       -> { data: Genre[] }
//   GET /api/search?q&type                -> { results, total }

const CINEROOM_BASE = 'https://movie-selfhosted.vercel.app'
const CINEROOM_API = `${CINEROOM_BASE}/api`
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const FETCH_TIMEOUT = 8000
// Ceiling for the whole call including backoff (2 retries x 10s + 2.1s backoff
// was ~22s, enough to stall the parallel fan-outs that call this).
const TOTAL_BUDGET = 12000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Never sleep past the call's total budget.
function backoff(ms: number, startedAt: number): number {
  return Math.min(ms, Math.max(0, TOTAL_BUDGET - (Date.now() - startedAt)))
}

async function cineGet<T>(path: string, retries = 2): Promise<T> {
  let lastErr: unknown
  const startedAt = Date.now()

  for (let attempt = 0; attempt <= retries; attempt++) {
    const remaining = TOTAL_BUDGET - (Date.now() - startedAt)
    if (remaining <= 500) break

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), Math.min(FETCH_TIMEOUT, remaining))
    try {
      const res = await fetch(`${CINEROOM_API}${path}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timer)
      if (res.status >= 500 || res.status === 429) {
        if (attempt < retries) {
          await delay(backoff(700 * Math.pow(2, attempt), startedAt))
          continue
        }
        throw new Error(`CineRoom error: ${res.status}`)
      }
      if (!res.ok) throw new Error(`CineRoom error: ${res.status}`)
      return (await res.json()) as T
    } catch (e) {
      clearTimeout(timer)
      lastErr = e
      if (attempt < retries) {
        await delay(backoff(700 * Math.pow(2, attempt), startedAt))
        continue
      }
      throw e
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('CineRoom: request failed')
}

export function cineImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${IMAGE_BASE}${path}`
}

export interface CineRoomMovie {
  id: string
  title: string
  slug: string
  posterPath: string | null
  backdropPath: string | null
  overview: string | null
  releaseDate: string | null
  runtime: number | null
  voteAverage: string | null
  quality: string | null
  country: string | null
  genres?: Array<{ name: string }>
}

export interface CineRoomSeries {
  id: string
  title: string
  slug: string
  posterPath: string | null
  backdropPath: string | null
  overview: string | null
  firstAirDate: string | null
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
  voteAverage: string | null
  status: string | null
  genres?: Array<{ name: string }>
  seasons?: Array<{
    seasonNumber: number
    name: string
    episodeCount: number
    isPublished: boolean
  }>
}

export interface CineRoomEpisode {
  id: string
  episodeNumber: number
  name: string
  overview: string | null
  stillPath: string | null
  airDate: string | null
  runtime: number | null
  hasVideo: boolean
}

/** Latest movies, newest first (their default sort is releaseDate desc). */
export async function getCineRoomMovies(page = 1, limit = 24): Promise<CineRoomMovie[]> {
  const j = await cineGet<{ data: CineRoomMovie[] }>(`/movies?page=${page}&limit=${Math.min(limit, 50)}`)
  return j.data ?? []
}

/** Latest series, newest first. */
export async function getCineRoomSeries(page = 1, limit = 24): Promise<CineRoomSeries[]> {
  const j = await cineGet<{ data: CineRoomSeries[] }>(`/series?page=${page}&limit=${Math.min(limit, 50)}`)
  return j.data ?? []
}

export async function getCineRoomMovie(slug: string): Promise<CineRoomMovie | null> {
  try {
    const j = await cineGet<{ data?: CineRoomMovie } & CineRoomMovie>(`/movies/${encodeURIComponent(slug)}`)
    return j.data ?? j
  } catch {
    return null
  }
}

export async function getCineRoomSeriesDetail(slug: string): Promise<CineRoomSeries | null> {
  try {
    const j = await cineGet<{ data?: CineRoomSeries } & CineRoomSeries>(`/series/${encodeURIComponent(slug)}`)
    return j.data ?? j
  } catch {
    return null
  }
}

export async function getCineRoomEpisodes(slug: string, season: number): Promise<CineRoomEpisode[]> {
  const j = await cineGet<{
    season: { episodes: CineRoomEpisode[] }
  }>(`/series/${encodeURIComponent(slug)}/season/${Math.trunc(season)}`)
  return j.season?.episodes ?? []
}

export async function getCineRoomGenres(): Promise<Array<{ name: string; slug: string }>> {
  const j = await cineGet<{ data: Array<{ name: string; slug: string }> }>('/genres')
  return j.data ?? []
}

export async function searchCineRoom(
  query: string,
  type?: 'movie' | 'series',
): Promise<Array<CineRoomMovie | CineRoomSeries>> {
  const t = type ? `&type=${type}` : ''
  const j = await cineGet<{ results: Array<CineRoomMovie | CineRoomSeries> }>(
    `/search?q=${encodeURIComponent(query)}${t}`,
  )
  return j.results ?? []
}

/** Watch URL on the CineRoom site itself (playback stays on their player). */
export function cineRoomWatchUrl(slug: string, isSeries: boolean): string {
  return isSeries ? `${CINEROOM_BASE}/serial/${slug}` : `${CINEROOM_BASE}/film/${slug}`
}
