import * as cheerio from 'cheerio'
import type { AnimeDetail, EpisodeItem } from '@/types'
import { extractSlug } from '@/lib/utils'

export function parseAnimeDetail(html: string): AnimeDetail {
  const $ = cheerio.load(html)

  const title = $('h1').first().text().replace(/\s*<.*$/, '').trim()
    .replace(/\(Episode.*\)/i, '').replace(/Subtitle Indonesia/i, '').trim()
  const image = $('.fotoanime img').attr('src') || ''
  const synopsis = $('.sinopc').text().trim() || $('.sinopsis').text().trim()

  const info: Record<string, string> = {}
  $('.infozingle p').each((_, el) => {
    const text = $(el).text()
    const [key, ...vals] = text.split(':')
    if (key && vals.length) {
      info[key.trim().toLowerCase()] = vals.join(':').trim()
    }
  })

  const genres: string[] = []
  $('.infozingle a[href*="/genres/"]').each((_, el) => {
    genres.push($(el).text().trim())
  })

  const episodes: EpisodeItem[] = []
  $('.episodelist ul li').each((_, el) => {
    const $el = $(el)
    const link = $el.find('a').attr('href') || ''
    const epTitle = $el.find('a').text().trim()
    const date = $el.find('.zeebr').text().trim()

    if (link.includes('/episode/')) {
      episodes.push({
        title: epTitle,
        slug: extractSlug(link),
        date: date || undefined,
      })
    }
  })

  return {
    title,
    japanese: info['japanese'] || undefined,
    image,
    synopsis,
    type: info['tipe'] || undefined,
    status: info['status'] || undefined,
    rating: info['skor'] || undefined,
    studio: info['studio'] || undefined,
    duration: info['durasi'] || undefined,
    season: info['tanggal rilis'] || undefined,
    genres,
    episodes,
  }
}
