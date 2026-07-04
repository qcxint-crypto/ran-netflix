import { NextResponse } from 'next/server'
import { getEpisode } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug') || 'anime-49233-episode-1'
  try {
    const data = await getEpisode(slug)
    const otaku = data.sources.some((s) => /desustream|odvidhide|filedon|mega|otakudesu/i.test(s.src))
    return NextResponse.json(
      {
        region: process.env.VERCEL_REGION,
        slug,
        title: data.title,
        via: otaku ? 'OTAKUDESU (real mirrors)' : 'international-embed fallback',
        sourceCount: data.sources.length,
        sources: data.sources.map((s) => s.src),
      },
      { headers: { 'cache-control': 'no-store' } }
    )
  } catch (e) {
    return NextResponse.json({ slug, error: e instanceof Error ? e.message : String(e) })
  }
}
