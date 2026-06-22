import * as cheerio from 'cheerio'
import type { AnimeCard, PaginatedResult } from '@/types'
import { parseAnimeCards, hasNextPage } from './helpers'

export function parseCompleted(html: string, page: number): PaginatedResult<AnimeCard> {
  const $ = cheerio.load(html)
  const data = parseAnimeCards($)
  return { data, currentPage: page, hasNextPage: hasNextPage($) }
}
