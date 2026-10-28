import { NextResponse } from 'next/server'
import { getEpisode, NotFoundError } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (!/^anime-\d+-episode-\d+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: 'Episode not found' }, { status: 404 })
  }

  try {
    const data = await getEpisode(slug)
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ ok: false, error: 'Episode not found' }, { status: 404 })
    }
    console.error('Episode fetch error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch episode data' }, { status: 500 })
  }
}
