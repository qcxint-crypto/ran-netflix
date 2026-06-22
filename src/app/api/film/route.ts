import { NextResponse } from 'next/server'
import { getFilmList } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const debug = searchParams.get('debug') === '1'
  const page = parseInt(searchParams.get('page') || '1', 10)

  if (debug) {
    try {
      const res = await fetch('https://tv11.lk21official.cc/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        cache: 'no-store',
      })
      const text = await res.text()
      const articleCount = (text.match(/<article/g) || []).length
      const hasCfChallenge = text.includes('cf-mitigated') || text.includes('challenge-platform')
      return NextResponse.json({
        status: res.status,
        htmlLength: text.length,
        articleCount,
        hasCfChallenge,
        headers: Object.fromEntries([...res.headers.entries()].filter(([k]) => k.startsWith('cf-') || k === 'server')),
        first200: text.substring(0, 200),
      })
    } catch (e) {
      return NextResponse.json({ error: String(e) })
    }
  }

  try {
    const data = await getFilmList(page)
    return NextResponse.json({ ok: true, data }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to fetch films' }, { status: 500 })
  }
}
