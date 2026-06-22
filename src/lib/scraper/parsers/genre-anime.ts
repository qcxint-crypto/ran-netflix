import * as cheerio from 'cheerio'
import type { AnimeCard, PaginatedResult } from '@/types'
import { extractSlug } from '@/lib/utils'
import { hasNextPage } from './helpers'

export function parseGenreAnime(html: string, page: number): PaginatedResult<AnimeCard> {
  const $ = cheerio.load(html)
  const data: AnimeCard[] = []

  $('.col-anime-con .col-anime').each((_, el) => {
    const $el = $(el)
    const link = $el.find('a').attr('href') || ''
    const title = $el.find('.col-anime-title a').text().trim()
    const image = $el.find('img').attr('src') || ''
    const rating = $el.find('.col-anime-rating').text().trim()
    const studio = $el.find('.col-anime-studio').text().trim()
    const eps = $el.find('.col-anime-eps').text().trim()

    if (title && link) {
      data.push({
        title,
        slug: extractSlug(link),
        image,
        rating: rating || undefined,
        episode: eps || undefined,
        type: studio || undefined,
      })
    }
  })

  return { data, currentPage: page, hasNextPage: hasNextPage($) }
}
