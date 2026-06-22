import { NextResponse } from 'next/server'
import { getFilmList } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const data = await getFilmList(page)
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to fetch films' }, { status: 500 })
  }
}
