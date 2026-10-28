import { NextResponse } from 'next/server'
import { getGogoEpisode } from '@/lib/scraper/gogo-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')?.trim() || ''
  const ep = parseInt(searchParams.get('ep') || '', 10)

  if (!slug || !Number.isFinite(ep) || ep < 1) {
    return NextResponse.json(
      { ok: false, error: 'slug and a positive ep are required' },
      { status: 400 }
    )
  }

  try {
    const data = await getGogoEpisode(slug, ep)
    // A miss is a 404, not a 502: the request was fine, the episode simply is
    // not on this mirror.
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Episode not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch (error) {
    console.error('Gogo episode error:', error)
    return NextResponse.json({ ok: false, error: 'Gogoanime episode failed' }, { status: 502 })
  }
}
