import { NextResponse } from 'next/server'
import { BASE_URL } from '@/lib/scraper/config'
import { gogoBase } from '@/lib/scraper/gogo-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

// One shared ceiling for the whole fan-out, so the status widget never waits on
// the slowest upstream. Each probe is bounded individually below it.
const PROBE_TIMEOUT = 5000

/** Any answer from the host counts as reachable — a 403/404 still means up. */
async function reachable(url: string, headers?: Record<string, string>): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'follow',
    })
    return res.status < 500
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  const malId = process.env.MAL_CLIENT_ID

  const [gogo, mal, otakudesu, lk21] = await Promise.all([
    reachable(`${gogoBase()}/`),
    // Unconfigured is a definite false — no point probing a keyless endpoint.
    malId
      ? reachable(
          'https://api.myanimelist.net/v2/anime/ranking?ranking_type=all&limit=1',
          { 'X-MAL-CLIENT-ID': malId }
        )
      : Promise.resolve(false),
    reachable(BASE_URL),
    reachable('https://api.themoviedb.org/3/configuration'),
  ])

  return NextResponse.json(
    { gogo, mal, otakudesu, lk21 },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
  )
}
