export interface AnimeCard {
  title: string
  slug: string
  image: string
  episode?: string
  type?: string
  rating?: string
  status?: string
  // Set when the item has no internal detail page and should link straight at
  // the provider instead (gogoanime search results).
  externalUrl?: string
}

export interface AnimeDetail {
  title: string
  japanese?: string
  image: string
  synopsis: string
  type?: string
  status?: string
  rating?: string
  studio?: string
  duration?: string
  season?: string
  genres: string[]
  episodes: EpisodeItem[]
  batchLinks?: BatchLink[]
  // MyAnimeList id, when the upstream metadata provider exposes one. Drives the
  // external MAL link and the score badge.
  malId?: number
  // MAL community score. AniList and MAL disagree often enough that the page
  // shows both rather than pretending one is authoritative.
  malScore?: number
}

export interface EpisodeItem {
  title: string
  slug: string
  date?: string
}

export interface BatchLink {
  label: string
  url: string
}

export interface StreamingSource {
  label: string
  quality: string
  server: number
  src: string
  // Trusted embeds (no popup ads) refuse to play inside a sandboxed iframe,
  // so they opt out; untrusted ad-heavy embeds stay sandboxed to block popups.
  noSandbox?: boolean
  // External link: opens in a new tab instead of an iframe (used when the
  // provider's playback must stay on their own site).
  external?: boolean
}

export interface EpisodeData {
  title: string
  animeTitle?: string
  animeSlug?: string
  prevSlug?: string
  nextSlug?: string
  sources: StreamingSource[]
  // Set when no playable source could be resolved, so the UI can show a clear
  // empty state instead of a broken player.
  note?: string
}

export interface Genre {
  name: string
  slug: string
}

export interface PaginatedResult<T> {
  data: T[]
  currentPage: number
  hasNextPage: boolean
}

export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

export interface HomeData {
  ongoing: AnimeCard[]
  completed: AnimeCard[]
  movies?: AnimeCard[]
  manga?: MangaCard[]
  films?: FilmCard[]
  malTop?: AnimeCard[]
}

// --- Film types (LK21) ---

export interface FilmCard {
  title: string
  slug: string
  image: string
  year?: string
  quality?: string
  duration?: string
  genre?: string
  episode?: string
  rating?: string
}

export interface FilmDetail {
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

// --- Manga types ---

export interface MangaCard {
  title: string
  slug: string
  image: string
  chapter?: string
  type?: string
}

export interface MangaDetail {
  title: string
  image: string
  synopsis: string
  type?: string
  author?: string
  status?: string
  genres: string[]
  chapters: MangaChapterItem[]
}

export interface MangaChapterItem {
  title: string
  slug: string
}

export interface MangaChapterData {
  title: string
  mangaSlug: string
  images: string[]
  prevSlug?: string
  nextSlug?: string
}
