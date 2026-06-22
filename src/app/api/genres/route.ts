import { NextResponse } from 'next/server'
import { getGenres } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  try {
    const data = await getGenres()
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to fetch genres' }, { status: 500 })
  }
}
