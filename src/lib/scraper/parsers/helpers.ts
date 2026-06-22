import * as cheerio from 'cheerio'
import type { AnimeCard } from '@/types'
import { extractSlug } from '@/lib/utils'

export function parseAnimeCards($: cheerio.CheerioAPI, selector = '.venz ul li'): AnimeCard[] {
  const cards: AnimeCard[] = []
  $(selector).each((_, el) => {
    const $el = $(el)
    const link = $el.find('.thumb a').attr('href') || $el.find('.thumbz a').attr('href') || ''
    const title = $el.find('h2.jdlflm').text().trim() || $el.find('.thumbz h2').text().trim()
    const image = $el.find('.thumbz img').attr('src') || ''
    const episode = $el.find('.epz').text().replace(/[^0-9\s]/g, '').trim()
    const rating = $el.find('.epztipe').text().replace(/[^\d.]/g, '').trim()
    const date = $el.find('.newnime').text().trim()

    if (title && link) {
      cards.push({
        title,
        slug: extractSlug(link),
        image,
        episode: episode || undefined,
        rating: rating || undefined,
        status: date || undefined,
      })
    }
  })
  return cards
}

export function hasNextPage($: cheerio.CheerioAPI): boolean {
  return $('.pagination .next, .hpage .r, .pagenavix .next').length > 0
}

export function parsePageNumber(page: string | null): number {
  const n = parseInt(page || '1', 10)
  return isNaN(n) || n < 1 ? 1 : n
}
