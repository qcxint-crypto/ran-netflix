import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

async function raw(url: string) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        Referer: 'https://otakudesu.blog/',
      },
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    })
    const body = await res.text()
    return {
      url,
      status: res.status,
      server: res.headers.get('server'),
      cfRay: res.headers.get('cf-ray'),
      cfMitigated: res.headers.get('cf-mitigated'),
      via: res.headers.get('via'),
      len: body.length,
      isChallenge:
        /just a moment|challenge-platform|__cf_chl|turnstile|enable javascript and cookies/i.test(
          body
        ),
      isCaptcha: /captcha|hcaptcha|recaptcha/i.test(body),
      titleTag: (body.match(/<title>([^<]*)<\/title>/i) || [])[1] || null,
      snippet: body.slice(0, 500).replace(/\s+/g, ' '),
    }
  } catch (e) {
    return { url, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) }
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  const targets = [
    'https://otakudesu.blog/?s=youjo&post_type=anime', // known 200
    'https://otakudesu.blog/anime/youjo-senki-subtitle-indonesia/', // 403?
    'https://otakudesu.blog/episode/yusen-episode-1-sub-indo/', // 403?
  ]
  const results = await Promise.all(targets.map(raw))
  return NextResponse.json(
    { region: process.env.VERCEL_REGION, results },
    { headers: { 'cache-control': 'no-store' } }
  )
}
