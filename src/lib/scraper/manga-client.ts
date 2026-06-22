import type { MangaCard, MangaDetail, MangaChapterData } from '@/types'

const MANGA_BASE = 'https://manga-api-rosy.vercel.app/api'
const FETCH_TIMEOUT = 20000
const MAX_RETRIES = 3

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchMangaApi<T>(path: string): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    try {
      const res = await fetch(`${MANGA_BASE}${path}`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timer)

      if (res.status === 429 || res.status >= 500) {
        if (attempt < MAX_RETRIES - 1) {
          await delay(1000 * Math.pow(2, attempt))
          continue
        }
        throw new Error(`Manga API error: ${res.status}`)
      }

      if (!res.ok) throw new Error(`Manga API error: ${res.status}`)
      return await res.json()
    } catch (e) {
      clearTimeout(timer)
      if (attempt === MAX_RETRIES - 1) throw e
      await delay(1000 * Math.pow(2, attempt))
    }
  }
  throw new Error('Manga API: max retries exceeded')
}

interface MangaListResponse {
  manga_list: Array<{
    title: string
    thumb: string
    type: string
    endpoint: string
    chapter: string
    updated_on?: string
    upload_on?: string
  }>
}

interface MangaDetailResponse {
  title: string
  thumb: string
  synopsis: string
  type: string
  author: string
  status: string
  genre_list: Array<{ genre_name: string }>
  chapter: Array<{ chapter_title: string; chapter_endpoint: string }>
}

interface MangaChapterResponse {
  chapter_image: Array<{ chapter_image_link: string; image_number: number }>
}

function endpointToSlug(endpoint: string): string {
  return endpoint.replace(/^\/+|\/+$/g, '')
}

function toMangaCard(item: MangaListResponse['manga_list'][0]): MangaCard {
  return {
    title: item.title,
    slug: endpointToSlug(item.endpoint),
    image: item.thumb,
    chapter: item.chapter,
    type: item.type,
  }
}

export async function getLatestManga(page: number): Promise<MangaCard[]> {
  const res = await fetchMangaApi<MangaListResponse>(`/manga/page/${page}`)
  return (res.manga_list || []).map(toMangaCard)
}

export async function getPopularManga(page: number): Promise<MangaCard[]> {
  const res = await fetchMangaApi<MangaListResponse>(`/manga/popular/${page}`)
  return (res.manga_list || []).map(toMangaCard)
}

export async function getMangaDetail(slug: string): Promise<MangaDetail> {
  const res = await fetchMangaApi<MangaDetailResponse>(`/manga/detail/${slug}/`)
  return {
    title: res.title || slug.replace(/-/g, ' '),
    image: res.thumb || '',
    synopsis: res.synopsis || 'No synopsis available.',
    type: res.type || undefined,
    author: res.author || undefined,
    status: res.status || undefined,
    genres: (res.genre_list || []).map(g => g.genre_name),
    chapters: (res.chapter || []).map(ch => ({
      title: ch.chapter_title,
      slug: endpointToSlug(ch.chapter_endpoint),
    })),
  }
}

export async function getMangaChapter(chapterSlug: string, mangaSlug: string): Promise<MangaChapterData> {
  const res = await fetchMangaApi<MangaChapterResponse>(`/chapter/${chapterSlug}/`)
  const images = (res.chapter_image || [])
    .sort((a, b) => a.image_number - b.image_number)
    .map(img => img.chapter_image_link)

  return {
    title: chapterSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    mangaSlug,
    images,
  }
}

export async function searchManga(query: string): Promise<MangaCard[]> {
  try {
    const res = await fetchMangaApi<MangaListResponse>(`/search/${encodeURIComponent(query)}`)
    return (res.manga_list || []).map(toMangaCard)
  } catch {
    return []
  }
}
