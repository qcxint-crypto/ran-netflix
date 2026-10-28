import { cacheGet, cacheGetStale, cacheSet } from './cache'
import { NotFoundError, USER_AGENT } from './config'
export { NotFoundError }
import type {
  HomeData, AnimeCard, AnimeDetail, EpisodeData, Genre, PaginatedResult,
  MangaCard, MangaDetail, MangaChapterData,
  FilmCard, FilmDetail, StreamingSource,
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
} from './anilist-client'
import {
  getCineRoomMovies,
  getCineRoomSeries,
  getCineRoomMovie,
  getCineRoomSeriesDetail as fetchCineRoomSeriesDetail,
  searchCineRoom,
  cineImageUrl,
  cineRoomWatchUrl,
  type CineRoomMovie,
  type CineRoomSeries,
} from './cineroom-client'
import {
  getLatestManga as fetchLatestManga,
  getPopularManga as fetchPopularManga,
  getMangaDetail as fetchMangaDetail,
  getMangaChapter as fetchMangaChapter,
  searchManga as fetchSearchManga,
} from './manga-client'
import {
  findEpisodeUrl,
  getStreamingSources,
  getOtakuDesuEpisodes,
  matchAnimeByTitles,
} from './otakudesu-client'
import { getAnimasuEpisodeSources } from './animasu-client'
import { withTimeout } from './fetcher'
import { getGogoEpisode, matchGogoSeries, searchGogo } from './gogo-client'
import {
  malAnimeById,
  malConfigured,
  malTopAnime,
  type MalAnime,
} from './mal-client'
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
    // AniList carries the MAL id, so the page can link out without a second
    // lookup. 0 means the node has no MAL mapping.
    malId: anime.mal_id > 0 ? anime.mal_id : undefined,
    episodes: episodes,
  }
}

function malToAnimeCard(anime: MalAnime): AnimeCard {
  return {
    title: anime.title,
    // MAL ids are the same namespace AniList's idMal uses, so these cards route
    // through the existing detail page like any other anime.
    slug: `anime-${anime.id}`,
    image: anime.image || '',
    episode: anime.episodes ? `${anime.episodes} Episodes` : undefined,
    type: anime.type,
    rating: anime.score ? `⭐ ${anime.score}` : undefined,
  }
}

// --- Anime functions ---

export async function getHome(): Promise<HomeData> {
  const key = 'home'
  const cached = cacheGet<HomeData>(key)
  if (cached) return cached

  // The five sources are independent, so fan them out and bound each one. Run
  // sequentially a cold start summed every source's latency (30s+); bounded and
  // parallel the whole call finishes in roughly the slowest single source.
  const [ongoing, completed, movies, manga, films, malTop] = await Promise.all([
    withTimeout(getCurrentSeasonAnime(1, 12), 8000, null),
    withTimeout(getCompletedAnime(1, 12), 8000, null),
    withTimeout(getTopMovies(1, 12), 8000, null),
    withTimeout(fetchPopularManga(1), 8000, [] as MangaCard[]),
    withTimeout(getLK21Latest(1), 8000, [] as LK21Movie[]),
    withTimeout(getMalTop(12), 8000, [] as AnimeCard[]),
  ])

  const data: HomeData = {
    ongoing: (ongoing?.data ?? []).map(toAnimeCard),
    completed: (completed?.data ?? []).map(toAnimeCard),
    movies: (movies?.data ?? []).map(toAnimeCard),
    manga: (manga ?? []).slice(0, 12),
    films: (films ?? []).slice(0, 12).map(toFilmCard),
    malTop,
  }

  // Only serve partial data if it carries something; otherwise prefer stale.
  if (data.ongoing.length > 0 || data.completed.length > 0) {
    cacheSet(key, data, TTL.HOME)
    return data
  }
  return cacheGetStale<HomeData>(key) ?? data
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
  if (isNaN(malId)) throw new NotFoundError('Anime not found')

  try {
    const res = await getAnimeById(malId)
    const data = toAnimeDetail(res.data)
    // MAL score is decoration on top of the AniList payload. Bounded and
    // best-effort: a slow or unconfigured MAL must not delay the page.
    if (data.malId && malConfigured()) {
      const mal = await withTimeout(malAnimeById(data.malId), 4000, null)
      if (mal?.score) data.malScore = mal.score
    }
    cacheSet(key, data, TTL.DETAIL)
    return data
  } catch (err) {
    if (err instanceof NotFoundError) {
      const stale = cacheGetStale<AnimeDetail>(key)
      if (stale) return stale
      throw new NotFoundError('Anime not found')
    }
    const stale = cacheGetStale<AnimeDetail>(key)
    if (stale) return stale
    throw new Error('Failed to load anime detail')
  }
}

// Providers hand out a "maintenance" page in place of a player instead of
// failing, so the URL looks playable and the iframe renders a blank box. There
// is no reliable status code to key off — a dead mirror answers 200 — so match
// the path.
export const DEAD_PATH = /\/maintenance(\/|$|\?)/i

function isDeadSource(src: string): boolean {
  if (!src) return true
  return DEAD_PATH.test(src)
}

function dedupSources(list: StreamingSource[]): StreamingSource[] {
  const seen = new Set<string>()
  const out: StreamingSource[] = []
  for (const s of list) {
    const key = (s.src || '').trim()
    if (!key || seen.has(key)) continue
    if (isDeadSource(key)) continue
    seen.add(key)
    out.push(s)
  }
  return out
}

/**
 * Cheap reachability probe for last-resort embeds (vidnest / vidlink).
 * Uses HEAD first, falls back to GET on 405/501 or body-less hosts.
 * Also catches a soft 200 that redirects to /maintenance.
 */
async function isReachable(url: string, ms: number): Promise<boolean> {
  if (isDeadSource(url)) return false
  const tryFetch = async (method: 'HEAD' | 'GET'): Promise<boolean> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    try {
      const res = await fetch(url, {
        method,
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
        signal: controller.signal,
        cache: 'no-store',
      })
      const finalUrl = (res as unknown as { url?: string }).url || ''
      if (isDeadSource(finalUrl)) return false
      // Some CDNs answer HEAD with 405/403 but GET works.
      if (res.status === 405 || res.status === 501) return false
      return res.status < 500
    } catch {
      return false
    } finally {
      clearTimeout(timer)
    }
  }

  const headOk = await tryFetch('HEAD')
  if (headOk) return true
  // HEAD not supported — one cheap GET as fallback.
  return tryFetch('GET')
}

/** Probe a tier in parallel, bounded, with a per-probe ceiling. */
async function filterAliveSources(
  srcs: StreamingSource[],
  perProbeMs: number
): Promise<StreamingSource[]> {
  if (srcs.length === 0) return []
  const checks = await Promise.all(srcs.map((s) => isReachable(s.src, perProbeMs)))
  return srcs.filter((_, i) => checks[i])
}

// Total wall budget for getEpisode including AniList metadata + otakudesu index
// + mirror resolution + gogo + last-resort probes. Vercel maxDuration = 60s on
// the route, so leave headroom for the sidebar fetch that follows.
const TOTAL_EPISODE_BUDGET_MS = 45_000

/**
 * Resolve the gogoanime embed for one episode. Returns null on any miss so the
 * caller degrades to "no source" rather than a broken player.
 */
async function resolveGogoSource(
  titles: string[],
  episode: number
): Promise<StreamingSource | null> {
  try {
    const slug = await matchGogoSeries(titles)
    if (!slug) return null
    const found = await getGogoEpisode(slug, episode)
    if (!found?.embedUrl) return null
    return {
      label: 'Gogoanime',
      quality: 'default',
      server: 1,
      src: found.embedUrl,
    }
  } catch {
    return null
  }
}

/** Top MyAnimeList row. Empty when the client ID is unset or MAL is down. */
export async function getMalTop(limit = 12): Promise<AnimeCard[]> {
  if (!malConfigured()) return []
  const key = `mal:top:cards:${limit}`
  const cached = cacheGet<AnimeCard[]>(key)
  if (cached) return cached

  const top = await withTimeout(malTopAnime(limit), 8000, [] as MalAnime[])
  const cards = top.map(malToAnimeCard)
  if (cards.length > 0) cacheSet(key, cards, TTL.DETAIL)
  return cards
}

/** Gogoanime search, shaped as anime cards for the search page. */
export async function searchGogoCards(query: string): Promise<AnimeCard[]> {
  const q = query.trim()
  if (!q) return []

  // One AniList lookup buys posters for the whole result set, matched by title
  // overlap — cheaper than a per-result metadata call.
  const [results, metadata] = await Promise.all([
    searchGogo(q).catch(() => []),
    searchJikan(q).then((r) => r.data).catch(() => []),
  ])
  if (results.length === 0) return []

  return results.map((r) => {
    const tokens = new Set(r.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean))
    let poster: string | undefined
    let best = 0
    for (const m of metadata) {
      const mt = m.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean)
      if (mt.length === 0) continue
      let shared = 0
      mt.forEach((t) => { if (tokens.has(t)) shared++ })
      const score = shared / mt.length
      if (score > best) { best = score; poster = m.images.jpg.large_image_url || undefined }
    }
    return {
      slug: r.slug,
      title: r.title,
      image: (best >= 0.6 ? poster : undefined) || r.image || '',
      episode: r.status,
      // Gogo series have no MAL id, so the card links straight at the provider.
      externalUrl: r.url,
    } satisfies AnimeCard
  })
}

export async function getEpisode(slug: string): Promise<EpisodeData> {
  const key = `episode:${slug}`
  const cached = cacheGet<EpisodeData>(key)
  if (cached) return cached

  const match = slug.match(/^anime-(\d+)-episode-(\d+)$/)
  if (!match) throw new NotFoundError('Episode not found')

  const malId = parseInt(match[1], 10)
  const episodeNum = parseInt(match[2], 10)

  try {
    const animeRes = await getAnimeById(malId)
    const anime = animeRes.data

    const candidateTitles = [
      anime.title_english,
      anime.title,
      ...(anime.title_synonyms || []),
    ].filter(Boolean) as string[]

    const cachedSources = cacheGet<EpisodeData>(`episode-sources:${slug}`)?.sources || []

    // Scraper chain, bounded as a whole. Each scraper is itself retried with its
    // own budget, so without this outer cap a chain of misses could run for over
    // a minute; the fallback below is always cheap and always available.
    const scrapeSources = async (): Promise<StreamingSource[]> => {
      let found: StreamingSource[] = []

      // Source 1 — otakudesu (fuzzy-matched against its full title index, which
      // has a far higher hit rate than its weak ?s= search).
      try {
        const animeUrl = await matchAnimeByTitles(candidateTitles)
        if (animeUrl) {
          const episodes = await getOtakuDesuEpisodes(animeUrl)
          const target = episodes.find((ep) => {
            const m = ep.title.match(/episode\s*(\d+)/i)
            return m && parseInt(m[1], 10) === episodeNum
          })
          if (target) found = await getStreamingSources(target.url)
        }
        if (found.length === 0) {
          const searchTitle = anime.title_english || anime.title
          const episodeUrl = await findEpisodeUrl(searchTitle, episodeNum)
          if (episodeUrl) found = await getStreamingSources(episodeUrl)
          if (found.length === 0 && anime.title !== searchTitle) {
            const episodeUrl2 = await findEpisodeUrl(anime.title, episodeNum)
            if (episodeUrl2) found = await getStreamingSources(episodeUrl2)
          }
        }
      } catch {
        // otakudesu unreachable, try the next source
      }

      // Source 2 — animasu (covers many titles otakudesu lacks; native 480/720/
      // 1080p quality). animasu serves a Cloudflare JS-challenge to datacenter IPs
      // (incl. Vercel) but not to Indonesian residential IPs, so it only works when
      // fetchHTML is routed through an Indonesian residential proxy. Gated off by
      // default to avoid wasted 403 latency; set ENABLE_ANIMASU=1 (with a proxy) to
      // activate.
      if (found.length === 0 && process.env.ENABLE_ANIMASU === '1') {
        try {
          found = await getAnimasuEpisodeSources(candidateTitles, episodeNum)
        } catch {
          // animasu unreachable, fall through to embeds
        }
      }

      return found
    }

    let sources = cachedSources
    if (sources.length === 0) {
      sources = await withTimeout(scrapeSources(), 8000, [] as StreamingSource[])
    }

    // Upstreams hand out "maintenance" placeholders as if they were players, so
    // they render as a black box with no error. Drop them before anything else
    // looks at the list.
    sources = sources.filter((s) => !isDeadSource(s.src))

    // Gogoanime is the second provider and rides along as an extra selectable
    // server rather than only appearing when the first chain fails — it covers
    // titles otakudesu has never carried, and when the chain misses entirely it
    // is the fallback the brief calls for.
    const gogo = await withTimeout(resolveGogoSource(candidateTitles, episodeNum), 12000, null)
    if (gogo) sources = [...sources, gogo]

    if (sources.length === 0) {
      // Last resort: MAL-id-addressed embeds reachable from Indonesian ISPs
      // (vidsrc.cc is DNS-blocked there). Probe them first — an unreachable host
      // is exactly the "playable-looking dead URL" failure this task exists to
      // stop, and adding one blind would put the broken player straight back.
      const lastResort: StreamingSource[] = [
        { label: 'VidNest', quality: 'HD', server: 1, src: `https://vidnest.fun/anime/${malId}/${episodeNum}/sub`, noSandbox: true },
        { label: 'VidLink', quality: 'HD', server: 2, src: `https://vidlink.pro/anime/${malId}/${episodeNum}/sub?fallback=true`, noSandbox: true },
      ]
      const alive = await Promise.all(lastResort.map((s) => isReachable(s.src, 5000)))
      sources = lastResort.filter((_, i) => alive[i])
    }

    const data: EpisodeData = {
      title: `${anime.title} - Episode ${episodeNum}`,
      animeTitle: anime.title,
      animeSlug: `anime-${malId}`,
      prevSlug: episodeNum > 1 ? `anime-${malId}-episode-${episodeNum - 1}` : undefined,
      nextSlug: episodeNum < (anime.episodes || 999) ? `anime-${malId}-episode-${episodeNum + 1}` : undefined,
      sources,
      // Every provider missed. Say so explicitly; an empty player with no
      // explanation reads as a bug.
      note: sources.length === 0 ? 'No working source' : undefined,
    }

    cacheSet(key, data, TTL.EPISODE)
    return data
  } catch (err) {
    const stale = cacheGetStale<EpisodeData>(key)
    if (stale) return stale
    if (err instanceof NotFoundError) throw new NotFoundError('Episode not found')
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

// --- Film functions (LK21 + CineRoom) ---

// CineRoom catalogue slugs use `<title>-<year>` (e.g. the-storm-2026); LK21
// slugs use `movie-<tmdbId>`. Prefix tells getFilmDetail which client to hit.
function cineMovieToCard(m: CineRoomMovie): FilmCard {
  return {
    title: m.title,
    slug: `cine-${m.slug}`,
    image: cineImageUrl(m.posterPath),
    year: m.releaseDate?.substring(0, 4),
    quality: m.quality || 'HD',
    rating: m.voteAverage && m.voteAverage !== '0' ? `⭐ ${Number(m.voteAverage).toFixed(1)}` : undefined,
    genre: m.genres?.map((g) => g.name).join(', ') || undefined,
  }
}

function cineSeriesToCard(s: CineRoomSeries): FilmCard {
  return {
    title: s.title,
    slug: `cine-series-${s.slug}`,
    image: cineImageUrl(s.posterPath),
    year: s.firstAirDate?.substring(0, 4),
    quality: 'HD',
    episode: s.numberOfEpisodes ? `${s.numberOfEpisodes} Episodes` : undefined,
    rating: s.voteAverage && s.voteAverage !== '0' ? `⭐ ${Number(s.voteAverage).toFixed(1)}` : undefined,
    genre: s.genres?.map((g) => g.name).join(', ') || undefined,
  }
}

export async function getFilmList(page: number): Promise<PaginatedResult<FilmCard>> {
  const key = `film-list:${page}`
  const cached = cacheGet<PaginatedResult<FilmCard>>(key)
  if (cached) return cached

  // Merge TMDB trending (LK21 client) with the CineRoom catalogue: half
  // movies, half series, so both surfaces show up on the film page.
  const results: FilmCard[] = []
  try {
    const [lk21, cineMovies, cineSeries] = await Promise.all([
      getLK21Latest(page).catch(() => [] as LK21Movie[]),
      getCineRoomMovies(page, 12).catch(() => [] as CineRoomMovie[]),
      getCineRoomSeries(page, 12).catch(() => [] as CineRoomSeries[]),
    ])
    results.push(...lk21.slice(0, 20).map(toFilmCard))
    results.push(...cineMovies.map(cineMovieToCard))
    results.push(...cineSeries.map(cineSeriesToCard))
  } catch {
    // fall through to stale/empty below
  }

  if (results.length > 0) {
    const result: PaginatedResult<FilmCard> = {
      data: results,
      currentPage: page,
      hasNextPage: results.length >= 20,
    }
    cacheSet(key, result, TTL.FILM)
    return result
  }

  const stale = cacheGetStale<PaginatedResult<FilmCard>>(key)
  if (stale) return stale
  return { data: [], currentPage: page, hasNextPage: false }
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
  // CineRoom items: cine-<slug> (movie) or cine-series-<slug> (series).
  // Playback stays on the CineRoom site (their stream is deliberately gated);
  // the player embed is replaced by an external link in the film detail page.
  if (slug.startsWith('cine-series-')) {
    const cineSlug = slug.replace('cine-series-', '')
    const key = `film-detail:${slug}`
    const cached = cacheGet<FilmDetail>(key)
    if (cached) return cached

    const s = await fetchCineRoomSeriesDetail(cineSlug)
    if (!s) throw new Error('Series not found on CineRoom')

    const result: FilmDetail = {
      title: s.title,
      image: cineImageUrl(s.posterPath),
      synopsis: s.overview || 'No synopsis available.',
      year: s.firstAirDate?.substring(0, 4),
      genre: s.genres?.map((g) => g.name).join(', ') || undefined,
      rating: s.voteAverage && s.voteAverage !== '0' ? Number(s.voteAverage).toFixed(1) : undefined,
      quality: 'HD',
      // External deep link: opens on CineRoom with their own ad-free player.
      sources: [
        {
          label: 'Nonton di CineRoom',
          quality: 'HD',
          server: 1,
          src: cineRoomWatchUrl(cineSlug, true),
          noSandbox: true,
          external: true,
        },
      ],
    }
    cacheSet(key, result, TTL.FILM_DETAIL)
    return result
  }

  if (slug.startsWith('cine-')) {
    const cineSlug = slug.replace('cine-', '')
    const key = `film-detail:${slug}`
    const cached = cacheGet<FilmDetail>(key)
    if (cached) return cached

    const m = await getCineRoomMovie(cineSlug)
    if (!m) throw new Error('Movie not found on CineRoom')

    const result: FilmDetail = {
      title: m.title,
      image: cineImageUrl(m.backdropPath) || cineImageUrl(m.posterPath),
      synopsis: m.overview || 'No synopsis available.',
      year: m.releaseDate?.substring(0, 4),
      genre: m.genres?.map((g) => g.name).join(', ') || undefined,
      rating: m.voteAverage && m.voteAverage !== '0' ? Number(m.voteAverage).toFixed(1) : undefined,
      duration: m.runtime ? `${m.runtime} min` : undefined,
      quality: m.quality || 'HD',
      sources: [
        {
          label: 'Nonton di CineRoom',
          quality: 'HD',
          server: 1,
          src: cineRoomWatchUrl(cineSlug, false),
          noSandbox: true,
          external: true,
        },
      ],
    }
    cacheSet(key, result, TTL.FILM_DETAIL)
    return result
  }

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

  const results: FilmCard[] = []
  try {
    const [lk21, cine] = await Promise.all([
      fetchSearchLK21(query).catch(() => [] as LK21Movie[]),
      searchCineRoom(query).catch(() => [] as Array<CineRoomMovie | CineRoomSeries>),
    ])
    results.push(...lk21.map(toFilmCard))
    for (const item of cine) {
      if ('firstAirDate' in item) {
        results.push(cineSeriesToCard(item))
      } else {
        results.push(cineMovieToCard(item))
      }
    }
  } catch {
    // fall through
  }

  if (results.length > 0) {
    cacheSet(key, results, TTL.SEARCH)
    return results
  }
  return []
}
