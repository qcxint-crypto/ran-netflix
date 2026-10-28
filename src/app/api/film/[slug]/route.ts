import { NextResponse } from 'next/server'
import { getFilmDetail } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  try {
    const data = await getFilmDetail(slug)
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to fetch film detail' }, { status: 404 })
  }
}
