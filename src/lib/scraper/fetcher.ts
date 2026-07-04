import { USER_AGENT, FETCH_TIMEOUT } from './config'

const RETRY_COUNT = 3
const RETRY_DELAY = 1000

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Sources like animasu/samehadaku/lk21 serve a Cloudflare JS-challenge to
// datacenter IPs. A plain fetch can't solve it. If FLARESOLVERR_URL points at a
// running FlareSolverr instance (free, headless-Chrome challenge solver, ideally
// on an Indonesian residential IP), route those fetches through it. Unset =>
// direct fetch, so default behaviour is unchanged.
async function fetchViaSolver(url: string): Promise<string> {
  const base = (process.env.FLARESOLVERR_URL || '').replace(/\/$/, '')
  // Bounded so a down/offline solver (e.g. the user's PC is off) fails fast and
  // getEpisode falls through to otakudesu/embeds instead of hanging.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 35000)
  try {
    const res = await fetch(`${base}/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Skip localtunnel's interstitial reminder page (ignored by others).
        'bypass-tunnel-reminder': 'true',
        'User-Agent': 'RANStream/1.0',
      },
      body: JSON.stringify({ cmd: 'request.get', url, maxTimeout: 30000 }),
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`FlareSolverr HTTP ${res.status}`)
    const json = (await res.json()) as { solution?: { response?: string } }
    const html = json?.solution?.response
    if (!html) throw new Error('FlareSolverr: empty response')
    return html
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchHTML(
  url: string,
  opts?: { solver?: boolean }
): Promise<string> {
  if (opts?.solver && process.env.FLARESOLVERR_URL) {
    return fetchViaSolver(url)
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < RETRY_COUNT; attempt++) {
    if (attempt > 0) await delay(RETRY_DELAY * attempt)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal,
        redirect: 'follow',
        cache: 'no-store',
      })
      clearTimeout(timer)

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`)
        continue
      }

      return await res.text()
    } catch (err) {
      clearTimeout(timer)
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  throw lastError || new Error('Fetch failed')
}

export async function postAjax(url: string, body: Record<string, string>): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  const baseUrl = url.replace('/wp-admin/admin-ajax.php', '')

  try {
    const params = new URLSearchParams(body)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': baseUrl,
        'Referer': baseUrl + '/',
      },
      body: params.toString(),
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}
