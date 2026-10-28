import { NextResponse } from 'next/server'
import { getHome } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
// getHome fans out with an 8s per-source cap, so it always resolves well under
// this; the ceiling only guards the platform from a pathological hang.
export const maxDuration = 15

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
