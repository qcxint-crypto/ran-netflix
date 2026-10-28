// AniList-backed metadata client.
// Exposes the exact same public API as the previous jikan-client (same function
// names, same JikanAnime/JikanResponse shapes) so `scraper/index.ts` and every
// page keep working unchanged — only the transport differs (AniList GraphQL).
//
// Why: api.jikan.moe became unreachable from Vercel sin1 (connection timeout),
// which 504'd every anime API route. graphql.anilist.co is fast (~400ms) and
// exposes idMal, so MAL-based slugs (anime-<mal_id>) still resolve.

import { NotFoundError } from './config'

const ANILIST_URL = 'https://graphql.anilist.co'
const FETCH_TIMEOUT = 6000
const MAX_RETRIES = 2
// Ceiling for the whole call including backoff, so a hung AniList cannot stall
// the caller past its route budget.
const TOTAL_BUDGET = 9000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  let lastErr: unknown
  const startedAt = Date.now()

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const remaining = TOTAL_BUDGET - (Date.now() - startedAt)
    if (remaining <= 500) break

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), Math.min(FETCH_TIMEOUT, remaining))
    try {
      const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timer)
      // AniList answers an unknown idMal with HTTP 404 and data:null. That is a
      // missing title, not a transient fault, so surface it distinctly and do
      // not burn a retry on it.
      if (res.status === 404) throw new NotFoundError('Not found on AniList')
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`AniList error: ${res.status}`)
        if (attempt < MAX_RETRIES - 1) {
          await delay(Math.min(800 * Math.pow(2, attempt), Math.max(0, TOTAL_BUDGET - (Date.now() - startedAt))))
          continue
        }
        throw lastErr
      }
      if (!res.ok) throw new Error(`AniList error: ${res.status}`)
      const json = await res.json()
      if (json.errors?.length) throw new Error(json.errors[0].message || 'AniList GraphQL error')
      return json.data as T
    } catch (e) {
      clearTimeout(timer)
      lastErr = e
      if (e instanceof NotFoundError || attempt === MAX_RETRIES - 1) throw e
      await delay(Math.min(800 * Math.pow(2, attempt), Math.max(0, TOTAL_BUDGET - (Date.now() - startedAt))))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('AniList: max retries exceeded')
}

// --- Public shapes (mirror the old Jikan ones) ---

export interface JikanAnime {
  mal_id: number
  title: string
  title_english?: string
  title_japanese?: string
  title_synonyms?: string[]
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

// --- AniList raw shapes ---

interface AniListMedia {
  idMal: number | null
  title: { romaji: string | null; english: string | null; native: string | null }
  synonyms: string[] | null
  coverImage: { extraLarge: string | null; large: string | null; medium: string | null } | null
  description: string | null
  format: string | null
  episodes: number | null
  nextAiringEpisode: { episode: number } | null
  status: string | null
  averageScore: number | null
  studios: { nodes: Array<{ name: string }> } | null
  duration: number | null
  season: string | null
  seasonYear: number | null
  genres: string[] | null
}

interface AniListPage {
  Page: {
    pageInfo: { currentPage: number; hasNextPage: boolean; lastPage: number }
    media: AniListMedia[]
  }
}

const MEDIA_FIELDS = `
  idMal
  title { romaji english native }
  synonyms
  coverImage { extraLarge large medium }
  description(asHtml: false)
  format
  episodes
  nextAiringEpisode { episode }
  status
  averageScore
  studios(isMain: true) { nodes { name } }
  duration
  season
  seasonYear
  genres
`

function stripHtml(s: string | null): string {
  if (!s) return 'No synopsis available.'
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function mapFormat(f: string | null): string {
  switch (f) {
    case 'TV': return 'TV'
    case 'TV_SHORT': return 'TV'
    case 'MOVIE': return 'Movie'
    case 'SPECIAL': return 'Special'
    case 'OVA': return 'OVA'
    case 'ONA': return 'ONA'
    case 'MUSIC': return 'Music'
    default: return f || 'TV'
  }
}

function mapStatus(s: string | null): string {
  switch (s) {
    case 'RELEASING': return 'Currently Airing'
    case 'FINISHED': return 'Finished Airing'
    case 'NOT_YET_RELEASED': return 'Not yet aired'
    case 'CANCELLED': return 'Cancelled'
    case 'HIATUS': return 'On Hiatus'
    default: return s || 'Unknown'
  }
}

function toJikan(m: AniListMedia): JikanAnime {
  return {
    mal_id: m.idMal ?? 0,
    title: m.title.english || m.title.romaji || 'Unknown',
    title_english: m.title.english ?? undefined,
    title_japanese: m.title.native ?? undefined,
    title_synonyms: m.synonyms ?? [],
    images: {
      jpg: {
        image_url: m.coverImage?.large || m.coverImage?.medium || '',
        large_image_url: m.coverImage?.extraLarge || m.coverImage?.large || '',
      },
      webp: {
        image_url: m.coverImage?.large || '',
        large_image_url: m.coverImage?.extraLarge || '',
      },
    },
    synopsis: stripHtml(m.description),
    type: mapFormat(m.format),
    // Ongoing shows report episodes: null on AniList; the next airing episode
    // number is the reliable total (One Piece -> 1181, not the old `|| 12`).
    episodes: m.episodes ?? m.nextAiringEpisode?.episode ?? null,
    status: mapStatus(m.status),
    rating: m.averageScore ? `Rating: ${m.averageScore}%` : 'Rating: N/A',
    score: m.averageScore ? m.averageScore / 10 : 0,
    studios: m.studios?.nodes.map((n) => ({ name: n.name })) ?? [],
    duration: m.duration ? `${m.duration} min per ep` : 'Unknown',
    season: m.season ? m.season.charAt(0) + m.season.slice(1).toLowerCase() : undefined,
    year: m.seasonYear ?? undefined,
    genres: (m.genres ?? []).map((name, i) => ({ mal_id: i, name })),
  }
}

function toResponse(media: AniListMedia[], page: AniListPage['Page']['pageInfo']): JikanResponse<JikanAnime[]> {
  return {
    data: media.map(toJikan),
    pagination: {
      has_next_page: page.hasNextPage,
      current_page: page.currentPage,
      last_visible_page: page.lastPage,
    },
  }
}

function currentSeason(): { season: string; year: number } {
  const now = new Date()
  const m = now.getUTCMonth()
  const year = now.getUTCFullYear()
  if (m <= 1 || m === 11) return { season: 'WINTER', year: m === 11 ? year + 1 : year }
  if (m <= 4) return { season: 'SPRING', year }
  if (m <= 7) return { season: 'SUMMER', year }
  return { season: 'FALL', year }
}

const PAGE_QUERY = `
query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $format: MediaFormat, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage lastPage }
    media(type: ANIME, season: $season, seasonYear: $seasonYear, status: $status, format: $format, sort: $sort, isAdult: false) {
      ${MEDIA_FIELDS}
    }
  }
}
`

export async function getTopAnime(page = 1, limit = 24): Promise<JikanResponse<JikanAnime[]>> {
  const d = await gql<AniListPage>(PAGE_QUERY, { page, perPage: limit, sort: 'SCORE_DESC' })
  return toResponse(d.Page.media, d.Page.pageInfo)
}

export async function getCurrentSeasonAnime(page = 1, limit = 24): Promise<JikanResponse<JikanAnime[]>> {
  const { season, year } = currentSeason()
  const d = await gql<AniListPage>(PAGE_QUERY, { page, perPage: limit, season, seasonYear: year, sort: 'POPULARITY_DESC' })
  return toResponse(d.Page.media, d.Page.pageInfo)
}

export async function getCompletedAnime(page = 1, limit = 24): Promise<JikanResponse<JikanAnime[]>> {
  const d = await gql<AniListPage>(PAGE_QUERY, { page, perPage: limit, status: 'FINISHED', sort: 'POPULARITY_DESC' })
  return toResponse(d.Page.media, d.Page.pageInfo)
}

export async function getTopMovies(page = 1, limit = 24): Promise<JikanResponse<JikanAnime[]>> {
  const d = await gql<AniListPage>(PAGE_QUERY, { page, perPage: limit, format: 'MOVIE', sort: 'POPULARITY_DESC' })
  return toResponse(d.Page.media, d.Page.pageInfo)
}

const SEARCH_QUERY = `
query ($page: Int, $perPage: Int, $search: String) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage lastPage }
    media(type: ANIME, search: $search, sort: SEARCH_MATCH, isAdult: false) {
      ${MEDIA_FIELDS}
    }
  }
}
`

export async function searchAnime(query: string): Promise<JikanResponse<JikanAnime[]>> {
  const d = await gql<AniListPage>(SEARCH_QUERY, { page: 1, perPage: 20, search: query })
  return toResponse(d.Page.media, d.Page.pageInfo)
}

export async function getAnimeById(id: number): Promise<JikanResponse<JikanAnime>> {
  const q = `
query ($idMal: Int) {
  Media(idMal: $idMal, type: ANIME) {
    ${MEDIA_FIELDS}
  }
}
`
  const d = await gql<{ Media: AniListMedia | null }>(q, { idMal: id })
  // AniList also resolves some ids to a null Media without a 404.
  if (!d.Media) throw new NotFoundError(`No AniList entry for MAL id ${id}`)
  return { data: toJikan(d.Media) }
}

export async function getGenres(): Promise<JikanResponse<Array<{ mal_id: number; name: string; count: number }>>> {
  const d = await gql<{ GenreCollection: string[] }>(`query { GenreCollection }`)
  return {
    data: d.GenreCollection.map((name, i) => ({ mal_id: i + 1, name, count: 0 })),
  }
}

// MAL genre id -> AniList genre name (AniList queries genres by name)
const MAL_ID_TO_ANILIST: Record<number, string> = {
  1: 'Action', 2: 'Adventure', 4: 'Comedy', 8: 'Drama', 10: 'Fantasy',
  14: 'Horror', 7: 'Mystery', 40: 'Psychological', 22: 'Romance', 24: 'Sci-Fi',
  36: 'Slice of Life', 30: 'Sports', 37: 'Supernatural', 41: 'Thriller',
  9: 'Ecchi', 35: 'Harem', 13: 'Historical', 18: 'Mecha', 38: 'Military',
  19: 'Music', 20: 'Parody', 23: 'School', 42: 'Seinen', 25: 'Shoujo',
  27: 'Shounen', 29: 'Space', 31: 'Super Power', 32: 'Vampire', 58: 'Gore',
  17: 'Martial Arts',
}

export async function getAnimeByGenre(genreId: number, page = 1, limit = 24): Promise<JikanResponse<JikanAnime[]>> {
  const genreName = MAL_ID_TO_ANILIST[genreId]
  if (!genreName) throw new Error(`Unknown genre id ${genreId}`)
  const q = `
query ($page: Int, $perPage: Int, $genre: String) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage lastPage }
    media(type: ANIME, genre: $genre, sort: POPULARITY_DESC, isAdult: false) {
      ${MEDIA_FIELDS}
    }
  }
}
`
  const d = await gql<AniListPage>(q, { page, perPage: limit, genre: genreName })
  return toResponse(d.Page.media, d.Page.pageInfo)
}

export function genreSlugToId(slug: string): number | null {
  const normalized = slug.toLowerCase().replace(/\s+/g, '-')
  const map: Record<string, number> = {
    action: 1, adventure: 2, comedy: 4, drama: 8, fantasy: 10, horror: 14,
    mystery: 7, psychological: 40, romance: 22, 'sci-fi': 24,
    'slice-of-life': 36, sports: 30, supernatural: 37, thriller: 41, ecchi: 9,
    harem: 35, historical: 13, mecha: 18, military: 38, music: 19, parody: 20,
    school: 23, seinen: 42, shoujo: 25, shounen: 27, space: 29,
    'super-power': 31, vampire: 32, gore: 58, 'martial-arts': 17,
  }
  return map[normalized] || null
}

export function genreToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}
