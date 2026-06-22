import * as cheerio from 'cheerio'
import type { HomeData } from '@/types'
import { parseAnimeCards } from './helpers'

export function parseHome(html: string): HomeData {
  const $ = cheerio.load(html)
  const sections = $('.venz')

  const ongoing = sections.length > 0 ? parseAnimeCards($, '.venz:first-of-type ul li') : []
  const completed = sections.length > 1 ? parseAnimeCards($, '.venz:last-of-type ul li') : []

  return { ongoing, completed }
}
