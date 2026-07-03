import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { fetchHTML } from '@/lib/scraper/fetcher'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Dumps the raw anime page as seen from Vercel so we can compare markup.
// /api/debug/probe?url=https://otakudesu.blog/anime/youjo-senki-subtitle-indonesia/
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url =
    searchParams.get('url') ||
    'https://otakudesu.blog/anime/youjo-senki-subtitle-indonesia/'

  const out: Record<string, unknown> = { region: process.env.VERCEL_REGION, url }

  try {
    const html = await fetchHTML(url)
    const $ = cheerio.load(html)
    out.len = html.length
    out.title = $('title').text().trim()
    out.selectors = {
      '.episodelist': $('.episodelist').length,
      '.episodelist ul li': $('.episodelist ul li').length,
      '.episodelist ul li a': $('.episodelist ul li a').length,
      'a[href*="/episode/"]': $('a[href*="/episode/"]').length,
      'a[href*="-episode-"]': $('a[href*="-episode-"]').length,
      '.venser': $('.venser').length,
      '.venutama': $('.venutama').length,
    }
    // sample episode-ish links regardless of container
    const links: string[] = []
    $('a').each((_, el) => {
      const href = $(el).attr('href') || ''
      if (/episode/i.test(href) && links.length < 6) links.push(href)
    })
    out.episodeLinksSample = links
    // is it a challenge / different page?
    out.isChallenge =
      /just a moment|challenge-platform|__cf_chl|enable javascript/i.test(html)
    out.snippet = html.slice(0, 200).replace(/\s+/g, ' ')
  } catch (e) {
    out.error = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
  }

  return NextResponse.json(out, { headers: { 'cache-control': 'no-store' } })
}
