const JIKAN_BASE = 'https://api.jikan.moe/v4'
const MIN_REQUEST_GAP = 350
const FETCH_TIMEOUT = 25000
const MAX_RETRIES = 3

let lastRequestTime = 0

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export interface JikanAnime {
  mal_id: number
  title: string
  title_english?: string
  title_japanese?: string
  images: {
    jpg: { image_url: string; large_image_url: string }
    webp: { image_url: string; large_image_url: string }
  }
  synopsis: string
  type: string
  episodes: number | null
  status: string
  rating: string
  score: number
  studios: Array<{ name: string }>
  duration: string
  season?: string
  year?: number
  genres: Array<{ mal_id: number; name: string }>
}

export interface JikanResponse<T> {
  data: T
  pagination?: {
    has_next_page: boolean
    current_page: number
    last_visible_page: number
  }
}

const GENRE_MAP: Record<string, number> = {
  'action': 1,
  'adventure': 2,
  'comedy': 4,
  'drama': 8,
  'fantasy': 10,
  'horror': 14,
  'mystery': 7,
  'psychological': 40,
  'romance': 22,
  'sci-fi': 24,
  'slice-of-life': 36,
  'sports': 30,
  'supernatural': 37,
  'thriller': 41,
  'ecchi': 9,
  'harem': 35,
  'historical': 13,
  'mecha': 18,
  'military': 38,
  'music': 19,
  'parody': 20,
  'school': 23,
  'seinen': 42,
  'shoujo': 25,
  'shounen': 27,
  'space': 29,
  'super-power': 31,
  'vampire': 32,
  'gore': 58,
  'martial-arts': 17,
}

async function fetchJikan<T>(path: string): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Enforce minimum gap between requests
    const now = Date.now()
    const elapsed = now - lastRequestTime
    if (elapsed < MIN_REQUEST_GAP) {
      await delay(MIN_REQUEST_GAP - elapsed)
    }
    lastRequestTime = Date.now()

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    try {
      const res = await fetch(`${JIKAN_BASE}${path}`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timer)

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10)
        await delay(retryAfter * 1000)
        continue
      }

      if (res.status >= 500) {
        if (attempt < MAX_RETRIES - 1) {
          await delay(1000 * Math.pow(2, attempt))
          continue
        }
        throw new Error(`Jikan API error: ${res.status}`)
      }

      if (!res.ok) {
        throw new Error(`Jikan API error: ${res.status}`)
      }

      return await res.json()
    } catch (e) {
      clearTimeout(timer)
      if (attempt === MAX_RETRIES - 1) throw e
      await delay(1000 * Math.pow(2, attempt))
    }
  }
  throw new Error('Jikan API: max retries exceeded')
}

export async function getTopAnime(page = 1, limit = 24): Promise<JikanResponse<JikanAnime[]>> {
  return fetchJikan(`/top/anime?page=${page}&limit=${limit}`)
}

export async function getCurrentSeasonAnime(page = 1, limit = 24): Promise<JikanResponse<JikanAnime[]>> {
  return fetchJikan(`/seasons/now?page=${page}&limit=${limit}`)
}

export async function getCompletedAnime(page = 1, limit = 24): Promise<JikanResponse<JikanAnime[]>> {
  return fetchJikan(`/top/anime?page=${page}&limit=${limit}&filter=bypopularity&status=complete`)
}

export async function getTopMovies(page = 1, limit = 24): Promise<JikanResponse<JikanAnime[]>> {
  return fetchJikan(`/top/anime?type=movie&page=${page}&limit=${limit}`)
}

export async function searchAnime(query: string): Promise<JikanResponse<JikanAnime[]>> {
  return fetchJikan(`/anime?q=${encodeURIComponent(query)}&limit=20&order_by=popularity`)
}

export async function getAnimeById(id: number): Promise<JikanResponse<JikanAnime>> {
  return fetchJikan(`/anime/${id}/full`)
}

export async function getGenres(): Promise<JikanResponse<Array<{ mal_id: number; name: string; count: number }>>> {
  return fetchJikan('/genres/anime')
}

export async function getAnimeByGenre(genreId: number, page = 1, limit = 24): Promise<JikanResponse<JikanAnime[]>> {
  return fetchJikan(`/anime?genres=${genreId}&page=${page}&limit=${limit}&order_by=popularity`)
}

export function genreSlugToId(slug: string): number | null {
  const normalized = slug.toLowerCase().replace(/\s+/g, '-')
  return GENRE_MAP[normalized] || null
}

export function genreToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}
