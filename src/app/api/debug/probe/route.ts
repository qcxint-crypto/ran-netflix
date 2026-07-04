import { NextResponse } from 'next/server'
import { getAnimasuEpisodeSources } from '@/lib/scraper/animasu-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const titles = (searchParams.get('titles') || 'One Piece').split('|').filter(Boolean)
  const ep = parseInt(searchParams.get('ep') || '1168', 10)
  const t0 = Date.now()
  try {
    const s = await getAnimasuEpisodeSources(titles, ep)
    return NextResponse.json({
      region: process.env.VERCEL_REGION,
      solverConfigured: Boolean(process.env.FLARESOLVERR_URL),
      animasuEnabled: process.env.ENABLE_ANIMASU === '1',
      titles, ep, ms: Date.now() - t0,
      count: s.length,
      sources: s.map((x) => ({ label: x.label, quality: x.quality, src: x.src })),
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) })
  }
}
