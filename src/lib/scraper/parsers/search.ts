import * as cheerio from 'cheerio'
import type { AnimeCard } from '@/types'
import { extractSlug } from '@/lib/utils'

export function parseSearch(html: string): AnimeCard[] {
  const $ = cheerio.load(html)
  const results: AnimeCard[] = []

  $('ul.chivsrc li').each((_, el) => {
    const $el = $(el)
    const link = $el.find('h2 a').attr('href') || ''
    const title = $el.find('h2 a').text().trim()
    const image = $el.find('img').attr('src') || ''
    const genres = $el.find('.set b:contains("Genres")').parent().text().replace('Genres : ', '').trim()
    const status = $el.find('.set b:contains("Status")').parent().text().replace('Status : ', '').trim()
    const rating = $el.find('.set b:contains("Rating")').parent().text().replace('Rating : ', '').trim()

    if (title && link) {
      results.push({
        title,
        slug: extractSlug(link),
        image,
        status: status || undefined,
        rating: rating || undefined,
        type: genres || undefined,
      })
    }
  })

  return results
}
