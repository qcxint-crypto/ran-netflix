import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

async function probe(url: string) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
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
      contentType: res.headers.get('content-type'),
      len: body.length,
      isChallenge:
        /just a moment|cf-challenge|challenge-platform|turnstile|__cf_chl|enable javascript and cookies/i.test(
          body
        ),
      snippet: body.slice(0, 300).replace(/\s+/g, ' '),
    }
  } catch (e) {
    return { url, error: e instanceof Error ? e.message : String(e) }
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  const targets = [
    'https://otakudesu.blog/?s=youjo+senki&post_type=anime',
    'https://otakudesu.cloud/?s=youjo+senki&post_type=anime',
    'https://otakudesu.best/?s=youjo+senki&post_type=anime',
  ]
  const results = await Promise.all(targets.map(probe))
  return NextResponse.json(
    {
      region: process.env.VERCEL_REGION || 'unknown',
      now: new Date().toISOString(),
      results,
    },
    { headers: { 'cache-control': 'no-store' } }
  )
}
