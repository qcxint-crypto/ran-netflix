import { NextResponse } from 'next/server'
import { getEpisode } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

async function raw(url: string) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), 15000)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*', 'Accept-Language': 'id-ID,id;q=0.9' },
      redirect: 'follow', cache: 'no-store', signal: c.signal,
    })
    const body = await res.text()
    return {
      url, status: res.status, server: res.headers.get('server'),
      cfRay: res.headers.get('cf-ray'), len: body.length,
      title: (body.match(/<title>([^<]*)<\/title>/i) || [])[1] || null,
      isChallenge: /just a moment|attention required|__cf_chl|enable javascript/i.test(body),
    }
  } catch (e) {
    return { url, error: e instanceof Error ? e.name : String(e) }
  } finally { clearTimeout(t) }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('animasu')) {
    const results = await Promise.all([
      raw('https://animasu.cc/?s=one+piece'),
      raw('https://v1.animasu.work/?s=one+piece'),
    ])
    return NextResponse.json({ region: process.env.VERCEL_REGION, results }, { headers: { 'cache-control': 'no-store' } })
  }
  const slug = searchParams.get('slug') || 'anime-52991-episode-1'
  try {
    const data = await getEpisode(slug)
    const host = (u: string) => { try { return new URL(u).hostname } catch { return u } }
    return NextResponse.json({
      region: process.env.VERCEL_REGION, slug, title: data.title, count: data.sources.length,
      hosts: Array.from(new Set(data.sources.map((s) => host(s.src)))),
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ slug, error: e instanceof Error ? e.message : String(e) })
  }
}
