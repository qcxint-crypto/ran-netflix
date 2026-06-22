import * as cheerio from 'cheerio'
import type { StreamingSource } from '@/types'

const LK21_BASE = 'https://lk21.org'
const FETCH_TIMEOUT = 20000
const MAX_RETRIES = 3
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchLK21(path: string): Promise<string> {
  const url = path.startsWith('http') ? path : `${LK21_BASE}${path}`
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.7',
        },
        signal: controller.signal,
        redirect: 'follow',
        cache: 'no-store',
      })
      clearTimeout(timer)
      if (!res.ok) {
        if (attempt < MAX_RETRIES - 1) { await delay(1000 * Math.pow(2, attempt)); continue }
        throw new Error(`LK21 HTTP ${res.status}`)
      }
      return await res.text()
    } catch (e) {
      clearTimeout(timer)
      if (attempt === MAX_RETRIES - 1) throw e
      await delay(1000 * Math.pow(2, attempt))
    }
  }
  throw new Error('LK21: max retries exceeded')
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

function parseMovieCards(html: string): LK21Movie[] {
  const $ = cheerio.load(html)
  const movies: LK21Movie[] = []

  $('article').each((_, el) => {
    const $el = $(el)
    const link = $el.find('figure > a').attr('href') || ''
    const title = $el.find('.poster-title').text().trim()
    const image = $el.find('img[itemprop="image"]').attr('src') ||
      $el.find('img').attr('data-src') || $el.find('img').attr('src') || ''
    const year = $el.find('.year').text().trim()
    const quality = $el.find('.label-HD, .label').text().trim()
    const duration = $el.find('.duration').text().trim()
    const genre = $el.find('.genre').text().trim()
    const episodeEl = $el.find('.episode')
    const episode = episodeEl.length ? episodeEl.text().trim() : undefined

    if (title && link) {
      const slug = link.replace(/^\/+|\/+$/g, '')
      movies.push({ title, slug, image, year, quality, duration, genre, episode })
    }
  })

  return movies
}

export async function getLK21Latest(page = 1): Promise<LK21Movie[]> {
  const path = page > 1 ? `/page/${page}/` : '/'
  const html = await fetchLK21(path)
  return parseMovieCards(html)
}

export async function getLK21Genre(genre: string, page = 1): Promise<LK21Movie[]> {
  const path = page > 1 ? `/genre/${genre}/page/${page}/` : `/genre/${genre}`
  const html = await fetchLK21(path)
  return parseMovieCards(html)
}

export async function searchLK21(query: string): Promise<LK21Movie[]> {
  const html = await fetchLK21(`/?s=${encodeURIComponent(query)}`)
  return parseMovieCards(html)
}

export async function getLK21Detail(slug: string): Promise<LK21Detail> {
  const html = await fetchLK21(`/${slug}`)
  const $ = cheerio.load(html)

  const rawTitle = $('h1').first().text().trim()
  const title = rawTitle.replace(/^Nonton\s+/i, '').replace(/\s+Sub Indo.*$/i, '').replace(/\s+di\s+Lk21$/i, '').trim()

  const ogTitle = $('meta[property="og:title"]').attr('content') || ''
  const image = $('meta[property="og:image"]').attr('content') ||
    $('img[itemprop="image"]').attr('src') || ''

  const synopsisEl = $('.synopsis')
  const synopsis = synopsisEl.text().trim() || $('meta[property="og:description"]').attr('content') || ''

  const ratingEl = $('[itemprop="ratingValue"]')
  const rating = ratingEl.text().trim() || undefined

  const genreMeta = $('meta[itemprop="genre"]').attr('content')
  const genre = genreMeta || undefined

  const yearMatch = ogTitle.match(/\((\d{4})\)/) || rawTitle.match(/\((\d{4})\)/)
  const year = yearMatch ? yearMatch[1] : undefined

  const sources: StreamingSource[] = []
  const iframeSrc = $('iframe#main-player').attr('src') || $('iframe').first().attr('src') || ''
  if (iframeSrc) {
    sources.push({ label: 'Server 1', quality: 'HD', server: 1, src: iframeSrc })
  }

  return { title, image, synopsis, year, genre, rating, sources }
}
