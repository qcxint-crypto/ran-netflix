import { NextResponse } from 'next/server'
import { getEpisode } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const data = await getEpisode(slug)
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
    })
  } catch (error) {
    console.error('Episode fetch error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch episode data' }, { status: 500 })
  }
}
