import { cacheGet, cacheGetStale, cacheSet } from './cache'
import type {
  HomeData, AnimeCard, AnimeDetail, EpisodeData, Genre, PaginatedResult,
  MangaCard, MangaDetail, MangaChapterData,
  FilmCard, FilmDetail,
} from '@/types'
import {
  getCurrentSeasonAnime,
  getTopAnime,
  getCompletedAnime,
  getTopMovies,
  searchAnime as searchJikan,
  getAnimeById,
  getGenres as getJikanGenres,
  getAnimeByGenre as getJikanByGenre,
  genreSlugToId,
  genreToSlug,
  type JikanAnime,
} from './jikan-client'
import {
  getLatestManga as fetchLatestManga,
  getPopularManga as fetchPopularManga,
  getMangaDetail as fetchMangaDetail,
  getMangaChapter as fetchMangaChapter,
  searchManga as fetchSearchManga,
} from './manga-client'
import { findEpisodeUrl, getStreamingSources } from './otakudesu-client'
import {
  getLK21Latest,
  getLK21Genre,
  getLK21Detail as fetchLK21Detail,
  searchLK21 as fetchSearchLK21,
  type LK21Movie,
} from './lk21-client'

const TTL = {
  HOME: 5 * 60 * 1000,
  LIST: 5 * 60 * 1000,
  DETAIL: 30 * 60 * 1000,
  EPISODE: 15 * 60 * 1000,
  SEARCH: 2 * 60 * 1000,
  GENRES: 60 * 60 * 1000,
  MANGA: 10 * 60 * 1000,
  MANGA_DETAIL: 30 * 60 * 1000,
  MANGA_CHAPTER: 60 * 60 * 1000,
  FILM: 10 * 60 * 1000,
  FILM_DETAIL: 30 * 60 * 1000,
}

function toFilmCard(movie: LK21Movie): FilmCard {
  return {
    title: movie.title,
    slug: movie.slug,
    image: movie.image,
    year: movie.year,
    quality: movie.quality,
    duration: movie.duration,
    genre: movie.genre,
    episode: movie.episode,
  }
}

function toAnimeCard(anime: JikanAnime): AnimeCard {
  return {
    title: anime.title,
    slug: `anime-${anime.mal_id}`,
    image: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
    episode: anime.episodes ? `${anime.episodes} Episodes` : undefined,
    type: anime.type,
    rating: anime.score ? `⭐ ${anime.score}` : undefined,
    status: anime.status,
  }
}

function toAnimeDetail(anime: JikanAnime): AnimeDetail {
  const episodes = []
  const episodeCount = anime.episodes || 12
  for (let i = 1; i <= Math.min(episodeCount, 100); i++) {
    episodes.push({
      title: `Episode ${i}`,
      slug: `anime-${anime.mal_id}-episode-${i}`,
      date: undefined,
    })
  }

  return {
    title: anime.title,
    japanese: anime.title_japanese,
    image: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
    synopsis: anime.synopsis || 'No synopsis available.',
    type: anime.type,
    status: anime.status,
    rating: anime.score ? `⭐ ${anime.score}` : undefined,
    studio: anime.studios?.[0]?.name,
    duration: anime.duration,
    season: anime.season && anime.year ? `${anime.season} ${anime.year}` : undefined,
    genres: anime.genres.map((g) => g.name),
    episodes: episodes,
  }
}

// --- Anime functions ---

export async function getHome(): Promise<HomeData> {
  const key = 'home'
  const cached = cacheGet<HomeData>(key)
  if (cached) return cached

  try {
    const ongoingRes = await getCurrentSeasonAnime(1, 12)
    const completedRes = await getCompletedAnime(1, 12)
    const moviesRes = await getTopMovies(1, 12)

    let manga: MangaCard[] = []
    try {
      const mangaRes = await fetchPopularManga(1)
      manga = mangaRes.slice(0, 12)
    } catch {}

    let films: FilmCard[] = []
    try {
      const lk21Res = await getLK21Latest(1)
      films = lk21Res.slice(0, 12).map(toFilmCard)
    } catch {}

    const data: HomeData = {
      ongoing: ongoingRes.data.map(toAnimeCard),
      completed: completedRes.data.map(toAnimeCard),
      movies: moviesRes.data.map(toAnimeCard),
      manga,
      films,
    }

    cacheSet(key, data, TTL.HOME)
    return data
  } catch {
    const stale = cacheGetStale<HomeData>(key)
    if (stale) return stale
    return { ongoing: [], completed: [], movies: [], manga: [], films: [] }
  }
}

export async function getOngoing(page: number): Promise<PaginatedResult<AnimeCard>> {
  const key = `ongoing:${page}`
  const cached = cacheGet<PaginatedResult<AnimeCard>>(key)
  if (cached) return cached

  try {
    const res = await getCurrentSeasonAnime(page, 24)
    const data: PaginatedResult<AnimeCard> = {
      data: res.data.map(toAnimeCard),
      currentPage: res.pagination?.current_page || page,
      hasNextPage: res.pagination?.has_next_page || false,
    }
    cacheSet(key, data, TTL.LIST)
    return data
  } catch {
    const stale = cacheGetStale<PaginatedResult<AnimeCard>>(key)
    if (stale) return stale
    return { data: [], currentPage: page, hasNextPage: false }
  }
}

export async function getCompleted(page: number): Promise<PaginatedResult<AnimeCard>> {
  const key = `completed:${page}`
  const cached = cacheGet<PaginatedResult<AnimeCard>>(key)
  if (cached) return cached

  try {
    const res = await getCompletedAnime(page, 24)
    const data: PaginatedResult<AnimeCard> = {
      data: res.data.map(toAnimeCard),
      currentPage: res.pagination?.current_page || page,
      hasNextPage: res.pagination?.has_next_page || false,
    }
    cacheSet(key, data, TTL.LIST)
    return data
  } catch {
    const stale = cacheGetStale<PaginatedResult<AnimeCard>>(key)
    if (stale) return stale
    return { data: [], currentPage: page, hasNextPage: false }
  }
}

export async function getMovies(page: number): Promise<PaginatedResult<AnimeCard>> {
  const key = `movies:${page}`
  const cached = cacheGet<PaginatedResult<AnimeCard>>(key)
  if (cached) return cached

  try {
    const res = await getTopMovies(page, 24)
    const data: PaginatedResult<AnimeCard> = {
      data: res.data.map(toAnimeCard),
      currentPage: res.pagination?.current_page || page,
      hasNextPage: res.pagination?.has_next_page || false,
    }
    cacheSet(key, data, TTL.LIST)
    return data
  } catch {
    const stale = cacheGetStale<PaginatedResult<AnimeCard>>(key)
    if (stale) return stale
    return { data: [], currentPage: page, hasNextPage: false }
  }
}

export async function searchAnime(query: string): Promise<AnimeCard[]> {
  const key = `search:${query}`
  const cached = cacheGet<AnimeCard[]>(key)
  if (cached) return cached

  try {
    const res = await searchJikan(query)
    const data = res.data.map(toAnimeCard)
    cacheSet(key, data, TTL.SEARCH)
    return data
  } catch {
    const stale = cacheGetStale<AnimeCard[]>(key)
    if (stale) return stale
    return []
  }
}

export async function getAnimeDetail(slug: string): Promise<AnimeDetail> {
  const key = `anime:${slug}`
  const cached = cacheGet<AnimeDetail>(key)
  if (cached) return cached

  const malId = parseInt(slug.replace('anime-', ''), 10)
  if (isNaN(malId)) throw new Error('Invalid anime slug')

  try {
    const res = await getAnimeById(malId)
    const data = toAnimeDetail(res.data)
    cacheSet(key, data, TTL.DETAIL)
    return data
  } catch {
    const stale = cacheGetStale<AnimeDetail>(key)
    if (stale) return stale
    throw new Error('Failed to load anime detail')
  }
}

export async function getEpisode(slug: string): Promise<EpisodeData> {
  const key = `episode:${slug}`
  const cached = cacheGet<EpisodeData>(key)
  if (cached) return cached

  const match = slug.match(/anime-(\d+)-episode-(\d+)/)
  if (!match) throw new Error('Invalid episode slug')

  const malId = parseInt(match[1], 10)
  const episodeNum = parseInt(match[2], 10)

  try {
    const animeRes = await getAnimeById(malId)
    const anime = animeRes.data

    let sources = cacheGet<EpisodeData>(`episode-sources:${slug}`)?.sources || []
    if (sources.length === 0) {
      try {
        const searchTitle = anime.title_english || anime.title
        const episodeUrl = await findEpisodeUrl(searchTitle, episodeNum)
        if (episodeUrl) {
          sources = await getStreamingSources(episodeUrl)
        }
        if (sources.length === 0 && anime.title !== searchTitle) {
          const episodeUrl2 = await findEpisodeUrl(anime.title, episodeNum)
          if (episodeUrl2) {
            sources = await getStreamingSources(episodeUrl2)
          }
        }
      } catch {
        // OtakuDesu failed (likely Cloudflare), continue with embed fallbacks
      }
    }

    if (sources.length === 0) {
      sources.push(
        { label: 'Server 1', quality: 'HD', server: 1, src: `https://vidsrc.to/embed/anime/mal/${malId}/${episodeNum}` },
        { label: 'Server 2', quality: 'HD', server: 2, src: `https://multiembed.mov/?video_id=${malId}&tmdb=0&mal=1&s=1&e=${episodeNum}` },
      )
    }

    const data: EpisodeData = {
      title: `${anime.title} - Episode ${episodeNum}`,
      animeTitle: anime.title,
      animeSlug: `anime-${malId}`,
      prevSlug: episodeNum > 1 ? `anime-${malId}-episode-${episodeNum - 1}` : undefined,
      nextSlug: episodeNum < (anime.episodes || 999) ? `anime-${malId}-episode-${episodeNum + 1}` : undefined,
      sources,
    }

    cacheSet(key, data, TTL.EPISODE)
    return data
  } catch {
    const stale = cacheGetStale<EpisodeData>(key)
    if (stale) return stale
    throw new Error('Failed to load episode')
  }
}

export async function getGenres(): Promise<Genre[]> {
  const key = 'genres'
  const cached = cacheGet<Genre[]>(key)
  if (cached) return cached

  try {
    const res = await getJikanGenres()
    const data = res.data.map((g) => ({
      name: g.name,
      slug: genreToSlug(g.name),
    }))
    cacheSet(key, data, TTL.GENRES)
    return data
  } catch {
    const stale = cacheGetStale<Genre[]>(key)
    if (stale) return stale
    return []
  }
}

export async function getGenreAnime(slug: string, page: number): Promise<PaginatedResult<AnimeCard>> {
  const key = `genre:${slug}:${page}`
  const cached = cacheGet<PaginatedResult<AnimeCard>>(key)
  if (cached) return cached

  const genreId = genreSlugToId(slug)
  if (!genreId) throw new Error('Unknown genre slug')

  try {
    const res = await getJikanByGenre(genreId, page, 24)
    const data: PaginatedResult<AnimeCard> = {
      data: res.data.map(toAnimeCard),
      currentPage: res.pagination?.current_page || page,
      hasNextPage: res.pagination?.has_next_page || false,
    }
    cacheSet(key, data, TTL.LIST)
    return data
  } catch {
    const stale = cacheGetStale<PaginatedResult<AnimeCard>>(key)
    if (stale) return stale
    return { data: [], currentPage: page, hasNextPage: false }
  }
}

export async function getAnimeList(): Promise<AnimeCard[]> {
  const key = 'anime-list'
  const cached = cacheGet<AnimeCard[]>(key)
  if (cached) return cached

  try {
    const res = await getTopAnime(1, 100)
    const data = res.data.map(toAnimeCard)
    cacheSet(key, data, TTL.GENRES)
    return data
  } catch {
    const stale = cacheGetStale<AnimeCard[]>(key)
    if (stale) return stale
    return []
  }
}

// --- Manga functions ---

export async function getMangaList(page: number): Promise<PaginatedResult<MangaCard>> {
  const key = `manga-list:${page}`
  const cached = cacheGet<PaginatedResult<MangaCard>>(key)
  if (cached) return cached

  try {
    const data = await fetchLatestManga(page)
    const result: PaginatedResult<MangaCard> = {
      data,
      currentPage: page,
      hasNextPage: data.length >= 20,
    }
    cacheSet(key, result, TTL.MANGA)
    return result
  } catch {
    const stale = cacheGetStale<PaginatedResult<MangaCard>>(key)
    if (stale) return stale
    return { data: [], currentPage: page, hasNextPage: false }
  }
}

export async function getMangaPopular(page: number): Promise<PaginatedResult<MangaCard>> {
  const key = `manga-popular:${page}`
  const cached = cacheGet<PaginatedResult<MangaCard>>(key)
  if (cached) return cached

  try {
    const data = await fetchPopularManga(page)
    const result: PaginatedResult<MangaCard> = {
      data,
      currentPage: page,
      hasNextPage: data.length >= 20,
    }
    cacheSet(key, result, TTL.MANGA)
    return result
  } catch {
    const stale = cacheGetStale<PaginatedResult<MangaCard>>(key)
    if (stale) return stale
    return { data: [], currentPage: page, hasNextPage: false }
  }
}

export async function getMangaDetailPage(slug: string): Promise<MangaDetail> {
  const key = `manga-detail:${slug}`
  const cached = cacheGet<MangaDetail>(key)
  if (cached) return cached

  try {
    const data = await fetchMangaDetail(slug)
    cacheSet(key, data, TTL.MANGA_DETAIL)
    return data
  } catch {
    const stale = cacheGetStale<MangaDetail>(key)
    if (stale) return stale
    throw new Error('Failed to load manga detail')
  }
}

export async function getMangaChapterPage(chapterSlug: string, mangaSlug: string): Promise<MangaChapterData> {
  const key = `manga-chapter:${chapterSlug}`
  const cached = cacheGet<MangaChapterData>(key)
  if (cached) return cached

  try {
    const data = await fetchMangaChapter(chapterSlug, mangaSlug)
    cacheSet(key, data, TTL.MANGA_CHAPTER)
    return data
  } catch {
    const stale = cacheGetStale<MangaChapterData>(key)
    if (stale) return stale
    throw new Error('Failed to load manga chapter')
  }
}

export async function searchManga(query: string): Promise<MangaCard[]> {
  const key = `manga-search:${query}`
  const cached = cacheGet<MangaCard[]>(key)
  if (cached) return cached

  try {
    const data = await fetchSearchManga(query)
    cacheSet(key, data, TTL.SEARCH)
    return data
  } catch {
    const stale = cacheGetStale<MangaCard[]>(key)
    if (stale) return stale
    return []
  }
}

// --- Film functions (LK21) ---

export async function getFilmList(page: number): Promise<PaginatedResult<FilmCard>> {
  const key = `film-list:${page}`
  const cached = cacheGet<PaginatedResult<FilmCard>>(key)
  if (cached) return cached

  try {
    const data = await getLK21Latest(page)
    const result: PaginatedResult<FilmCard> = {
      data: data.map(toFilmCard),
      currentPage: page,
      hasNextPage: data.length >= 20,
    }
    cacheSet(key, result, TTL.FILM)
    return result
  } catch {
    const stale = cacheGetStale<PaginatedResult<FilmCard>>(key)
    if (stale) return stale
    return { data: [], currentPage: page, hasNextPage: false }
  }
}

export async function getFilmGenre(genre: string, page: number): Promise<PaginatedResult<FilmCard>> {
  const key = `film-genre:${genre}:${page}`
  const cached = cacheGet<PaginatedResult<FilmCard>>(key)
  if (cached) return cached

  try {
    const data = await getLK21Genre(genre, page)
    const result: PaginatedResult<FilmCard> = {
      data: data.map(toFilmCard),
      currentPage: page,
      hasNextPage: data.length >= 20,
    }
    cacheSet(key, result, TTL.FILM)
    return result
  } catch {
    const stale = cacheGetStale<PaginatedResult<FilmCard>>(key)
    if (stale) return stale
    return { data: [], currentPage: page, hasNextPage: false }
  }
}

export async function getFilmDetail(slug: string): Promise<FilmDetail> {
  const key = `film-detail:${slug}`
  const cached = cacheGet<FilmDetail>(key)
  if (cached) return cached

  try {
    const data = await fetchLK21Detail(slug)
    const result: FilmDetail = {
      title: data.title,
      image: data.image,
      synopsis: data.synopsis,
      year: data.year,
      genre: data.genre,
      rating: data.rating,
      duration: data.duration,
      quality: data.quality,
      sources: data.sources,
    }
    cacheSet(key, result, TTL.FILM_DETAIL)
    return result
  } catch {
    const stale = cacheGetStale<FilmDetail>(key)
    if (stale) return stale
    throw new Error('Failed to load film detail')
  }
}

export async function searchFilm(query: string): Promise<FilmCard[]> {
  const key = `film-search:${query}`
  const cached = cacheGet<FilmCard[]>(key)
  if (cached) return cached

  try {
    const data = await fetchSearchLK21(query)
    const result = data.map(toFilmCard)
    cacheSet(key, result, TTL.SEARCH)
    return result
  } catch {
    const stale = cacheGetStale<FilmCard[]>(key)
    if (stale) return stale
    return []
  }
}
