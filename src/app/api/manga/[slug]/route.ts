import { NextResponse } from 'next/server'
import { getMangaDetailPage } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const data = await getMangaDetailPage(slug)
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to fetch manga detail' }, { status: 500 })
  }
}
