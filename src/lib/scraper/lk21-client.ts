import type { StreamingSource } from '@/types'

const TMDB_KEY = '2dca580c2a14b55200e784d157207b4d'
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'
const FETCH_TIMEOUT = 15000
const MAX_RETRIES = 3

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const separator = path.includes('?') ? '&' : '?'
  const url = `${TMDB_BASE}${path}${separator}api_key=${TMDB_KEY}&language=id-ID`

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timer)
      if (res.status === 429) {
        if (attempt < MAX_RETRIES - 1) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10)
          await delay(retryAfter * 1000)
          continue
        }
      }
      if (!res.ok) {
        if (attempt < MAX_RETRIES - 1) { await delay(1000 * Math.pow(2, attempt)); continue }
        throw new Error(`TMDB HTTP ${res.status}`)
      }
      return await res.json()
    } catch (e) {
      clearTimeout(timer)
      if (attempt === MAX_RETRIES - 1) throw e
      await delay(1000 * Math.pow(2, attempt))
    }
  }
  throw new Error('TMDB: max retries exceeded')
}

interface TMDBMovie {
  id: number
  title: string
  poster_path: string | null
  release_date?: string
  vote_average?: number
  overview?: string
  genre_ids?: number[]
}

interface TMDBMovieDetail {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  vote_average?: number
  overview?: string
  runtime?: number
  genres?: Array<{ id: number; name: string }>
  status?: string
}

interface TMDBResponse {
  results: TMDBMovie[]
  page: number
  total_pages: number
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
}

export interface LK21Movie {
  title: string
  slug: string
  image: string
  year?: string
  quality?: string
  duration?: string
  genre?: string
  episode?: string
}

export interface LK21Detail {
  title: string
  image: string
  synopsis: string
  year?: string
  genre?: string
  rating?: string
  duration?: string
  quality?: string
  sources: StreamingSource[]
}

function toMovie(m: TMDBMovie): LK21Movie {
  const year = m.release_date?.substring(0, 4)
  const genres = (m.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean).join(', ')
  return {
    title: m.title,
    slug: `movie-${m.id}`,
    image: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : '',
    year,
    genre: genres || undefined,
    quality: 'HD',
  }
}

export async function getLK21Latest(page = 1): Promise<LK21Movie[]> {
  const data = await tmdbFetch<TMDBResponse>(`/trending/movie/week?page=${page}`)
  return data.results.map(toMovie)
}

export async function getLK21Genre(genre: string, page = 1): Promise<LK21Movie[]> {
  const genreId = Object.entries(GENRE_MAP).find(([, name]) =>
    name.toLowerCase() === genre.toLowerCase()
  )?.[0]

  if (!genreId) {
    const data = await tmdbFetch<TMDBResponse>(`/movie/popular?page=${page}`)
    return data.results.map(toMovie)
  }

  const data = await tmdbFetch<TMDBResponse>(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=${page}`)
  return data.results.map(toMovie)
}

export async function searchLK21(query: string): Promise<LK21Movie[]> {
  const data = await tmdbFetch<TMDBResponse>(`/search/movie?query=${encodeURIComponent(query)}`)
  return data.results.map(toMovie)
}

export async function getLK21Detail(slug: string): Promise<LK21Detail> {
  const tmdbId = slug.replace('movie-', '')
  const data = await tmdbFetch<TMDBMovieDetail>(`/movie/${tmdbId}`)

  let synopsis = data.overview || ''
  if (!synopsis) {
    try {
      const enData = await tmdbFetch<TMDBMovieDetail>(`/movie/${tmdbId}?language=en-US`)
      synopsis = enData.overview || ''
    } catch {}
  }

  const genres = (data.genres || []).map(g => g.name).join(', ')
  const year = data.release_date?.substring(0, 4)

  const sources: StreamingSource[] = [
    { label: 'Server 1', quality: 'HD', server: 1, src: `https://vidsrc.to/embed/movie/${tmdbId}` },
    { label: 'Server 2', quality: 'HD', server: 2, src: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1` },
  ]

  return {
    title: data.title,
    image: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` :
      data.poster_path ? `${TMDB_IMG}${data.poster_path}` : '',
    synopsis: synopsis || 'No synopsis available.',
    year,
    genre: genres || undefined,
    rating: data.vote_average ? `${data.vote_average.toFixed(1)}` : undefined,
    duration: data.runtime ? `${data.runtime} min` : undefined,
    quality: 'HD',
    sources,
  }
}
