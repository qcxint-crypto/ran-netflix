import * as cheerio from 'cheerio'
import type { Genre } from '@/types'
import { extractSlug } from '@/lib/utils'

export function parseGenres(html: string): Genre[] {
  const $ = cheerio.load(html)
  const genres: Genre[] = []

  $('a[href*="/genres/"]').each((_, el) => {
    const name = $(el).text().trim()
    const href = $(el).attr('href') || ''
    const slug = extractSlug(href)
    if (name && slug && !genres.some(g => g.slug === slug)) {
      genres.push({ name, slug })
    }
  })

  return genres
}
