import * as cheerio from 'cheerio'
import type { AnimeCard } from '@/types'
import { extractSlug } from '@/lib/utils'

export function parseAnimeList(html: string): AnimeCard[] {
  const $ = cheerio.load(html)
  const results: AnimeCard[] = []

  $('.barone .jdlbar').each((_, barEl) => {
    const letter = $(barEl).text().trim()
    const $next = $(barEl).next('.penzbar')
    $next.find('.hodebars a').each((_, aEl) => {
      const $a = $(aEl)
      const title = $a.text().trim()
      const href = $a.attr('href') || ''
      if (title && href) {
        results.push({
          title,
          slug: extractSlug(href),
          image: '',
          type: letter,
        })
      }
    })
  })

  if (results.length === 0) {
    $('ul.daftar li a, .animelistmain a, .jdlbar + .penzbar a, .barone a').each((_, el) => {
      const title = $(el).text().trim()
      const href = $(el).attr('href') || ''
      if (title && href.includes('/anime/')) {
        results.push({ title, slug: extractSlug(href), image: '' })
      }
    })
  }

  return results
}
