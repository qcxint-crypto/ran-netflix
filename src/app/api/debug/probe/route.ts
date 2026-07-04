import { NextResponse } from 'next/server'
import { getEpisode } from '@/lib/scraper'
import { getAnimasuEpisodeSources } from '@/lib/scraper/animasu-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug') || 'anime-40748-episode-1'
  const titles = (searchParams.get('titles') || '').split('|').filter(Boolean)
  const ep = parseInt(searchParams.get('ep') || '1', 10)

  try {
    // Direct animasu test when titles are passed
    if (titles.length) {
      const s = await getAnimasuEpisodeSources(titles, ep)
      return NextResponse.json({
        region: process.env.VERCEL_REGION,
        mode: 'animasu-direct',
        titles, ep,
        count: s.length,
        sources: s.map((x) => ({ label: x.label, quality: x.quality, src: x.src })),
      }, { headers: { 'cache-control': 'no-store' } })
    }
    const data = await getEpisode(slug)
    const host = (u: string) => { try { return new URL(u).hostname } catch { return u } }
    return NextResponse.json({
      region: process.env.VERCEL_REGION,
      slug,
      title: data.title,
      count: data.sources.length,
      hosts: Array.from(new Set(data.sources.map((s) => host(s.src)))),
      qualities: Array.from(new Set(data.sources.map((s) => s.quality))),
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ slug, error: e instanceof Error ? e.message : String(e) })
  }
}
