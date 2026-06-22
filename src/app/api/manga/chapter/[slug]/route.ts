import { NextResponse } from 'next/server'
import { getMangaChapterPage } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const mangaSlug = searchParams.get('manga') || ''
    const data = await getMangaChapterPage(slug, mangaSlug)
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to fetch chapter' }, { status: 500 })
  }
}
