import { NextResponse } from 'next/server'
import { getAnimeDetail, NotFoundError } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Reject a malformed slug before spending an upstream call on it.
  if (!/^anime-\d+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: 'Anime not found' }, { status: 404 })
  }

  try {
    const data = await getAnimeDetail(slug)
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ ok: false, error: 'Anime not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: false, error: 'Failed to fetch anime detail' }, { status: 500 })
  }
}
