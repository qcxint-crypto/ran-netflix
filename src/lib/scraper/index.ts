import { BASE_URL } from './config'
import { fetchHTML } from './fetcher'
import { cacheGet, cacheSet } from './cache'
import { parseHome } from './parsers/home'
import { parseOngoing } from './parsers/ongoing'
import { parseCompleted } from './parsers/completed'
import { parseSearch } from './parsers/search'
import { parseAnimeDetail } from './parsers/anime-detail'
import { parseEpisode } from './parsers/episode'
import { parseGenres } from './parsers/genres'
import { parseGenreAnime } from './parsers/genre-anime'
import { parseAnimeList } from './parsers/anime-list'
import type { HomeData, AnimeCard, AnimeDetail, EpisodeData, Genre, PaginatedResult } from '@/types'

const TTL = {
  HOME: 5 * 60 * 1000,
  LIST: 5 * 60 * 1000,
  DETAIL: 30 * 60 * 1000,
  EPISODE: 15 * 60 * 1000,
  SEARCH: 2 * 60 * 1000,
  GENRES: 60 * 60 * 1000,
}

export async function getHome(): Promise<HomeData> {
  const key = 'home'
  const cached = cacheGet<HomeData>(key)
  if (cached) return cached

  const html = await fetchHTML(BASE_URL)
  const data = parseHome(html)
  cacheSet(key, data, TTL.HOME)
  return data
}

export async function getOngoing(page: number): Promise<PaginatedResult<AnimeCard>> {
  const key = `ongoing:${page}`
  const cached = cacheGet<PaginatedResult<AnimeCard>>(key)
  if (cached) return cached

  const url = page === 1 ? `${BASE_URL}/ongoing-anime/` : `${BASE_URL}/ongoing-anime/page/${page}/`
  const html = await fetchHTML(url)
  const data = parseOngoing(html, page)
  cacheSet(key, data, TTL.LIST)
  return data
}

export async function getCompleted(page: number): Promise<PaginatedResult<AnimeCard>> {
  const key = `completed:${page}`
  const cached = cacheGet<PaginatedResult<AnimeCard>>(key)
  if (cached) return cached

  const url = page === 1 ? `${BASE_URL}/complete-anime/` : `${BASE_URL}/complete-anime/page/${page}/`
  const html = await fetchHTML(url)
  const data = parseCompleted(html, page)
  cacheSet(key, data, TTL.LIST)
  return data
}

export async function searchAnime(query: string): Promise<AnimeCard[]> {
  const key = `search:${query}`
  const cached = cacheGet<AnimeCard[]>(key)
  if (cached) return cached

  const url = `${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`
  const html = await fetchHTML(url)
  const data = parseSearch(html)
  cacheSet(key, data, TTL.SEARCH)
  return data
}

export async function getAnimeDetail(slug: string): Promise<AnimeDetail> {
  const key = `anime:${slug}`
  const cached = cacheGet<AnimeDetail>(key)
  if (cached) return cached

  const url = `${BASE_URL}/anime/${slug}/`
  const html = await fetchHTML(url)
  const data = parseAnimeDetail(html)
  cacheSet(key, data, TTL.DETAIL)
  return data
}

export async function getEpisode(slug: string): Promise<EpisodeData> {
  const key = `episode:${slug}`
  const cached = cacheGet<EpisodeData>(key)
  if (cached) return cached

  const url = `${BASE_URL}/episode/${slug}/`
  const html = await fetchHTML(url)
  const data = await parseEpisode(html)
  cacheSet(key, data, TTL.EPISODE)
  return data
}

export async function getGenres(): Promise<Genre[]> {
  const key = 'genres'
  const cached = cacheGet<Genre[]>(key)
  if (cached) return cached

  const html = await fetchHTML(`${BASE_URL}/genre-list/`)
  const data = parseGenres(html)
  cacheSet(key, data, TTL.GENRES)
  return data
}

export async function getGenreAnime(slug: string, page: number): Promise<PaginatedResult<AnimeCard>> {
  const key = `genre:${slug}:${page}`
  const cached = cacheGet<PaginatedResult<AnimeCard>>(key)
  if (cached) return cached

  const url = page === 1 ? `${BASE_URL}/genres/${slug}/` : `${BASE_URL}/genres/${slug}/page/${page}/`
  const html = await fetchHTML(url)
  const data = parseGenreAnime(html, page)
  cacheSet(key, data, TTL.LIST)
  return data
}

export async function getAnimeList(): Promise<AnimeCard[]> {
  const key = 'anime-list'
  const cached = cacheGet<AnimeCard[]>(key)
  if (cached) return cached

  const html = await fetchHTML(`${BASE_URL}/anime-list/`)
  const data = parseAnimeList(html)
  cacheSet(key, data, TTL.GENRES)
  return data
}
