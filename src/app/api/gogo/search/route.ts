import { NextResponse } from 'next/server'
import { searchGogo } from '@/lib/scraper/gogo-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''
  if (!q) return NextResponse.json({ ok: true, data: [] })

  // A dead or rotated mirror yields [], not an error — the caller renders an
  // empty section either way.
  try {
    const data = await searchGogo(q)
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' },
    })
  } catch (error) {
    console.error('Gogo search error:', error)
    return NextResponse.json({ ok: false, error: 'Gogoanime search failed' }, { status: 502 })
  }
}
