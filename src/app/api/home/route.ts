import { NextResponse } from 'next/server'
import { getHome } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  try {
    const data = await getHome()
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to fetch home data' }, { status: 500 })
  }
}
