import { NextResponse } from 'next/server'
import { searchAnime } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    if (!q) return NextResponse.json({ ok: true, data: [] })
    const data = await searchAnime(q)
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Search failed' }, { status: 500 })
  }
}
