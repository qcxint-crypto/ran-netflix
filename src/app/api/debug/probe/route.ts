import { NextResponse } from 'next/server'
import { getEpisode } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Runs the EXACT production getEpisode() path. /api/debug/probe?slug=anime-49233-episode-1
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug') || 'anime-49233-episode-1'
  try {
    const data = await getEpisode(slug)
    return NextResponse.json(
      {
        region: process.env.VERCEL_REGION,
        slug,
        title: data.title,
        sourceCount: data.sources.length,
        sources: data.sources.map((s) => ({ label: s.label, quality: s.quality, src: s.src })),
      },
      { headers: { 'cache-control': 'no-store' } }
    )
  } catch (e) {
    return NextResponse.json({
      slug,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    })
  }
}
