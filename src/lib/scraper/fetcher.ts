import { USER_AGENT, FETCH_TIMEOUT } from './config'

const RETRY_COUNT = 3
const RETRY_DELAY = 1000

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchHTML(url: string): Promise<string> {
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
