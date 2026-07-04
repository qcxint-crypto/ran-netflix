import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

async function test(label: string, url: string) {
  const c = new AbortController()
  const timer = setTimeout(() => c.abort(), 15000)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: 'https://google.com/', Accept: 'text/html,*/*' },
      signal: c.signal,
      redirect: 'follow',
      cache: 'no-store',
    })
    const body = await res.text()
    return {
      label,
      status: res.status,
      len: body.length,
      notFound: /not found|couldn.?t find|no sources|unavailable|doesn.?t exist|sandbox/i.test(body),
      hasStream: /m3u8|\.mp4|hls|"?file"?\s*:|sources\s*:/i.test(body),
    }
  } catch (e) {
    return { label, error: e instanceof Error ? e.name : String(e) }
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  const movie = '27205' // Inception — available everywhere
  const mal = '52991' // Frieren — popular, widely mapped
  const targets: Array<[string, string]> = [
    ['MOV vidsrc.to', `https://vidsrc.to/embed/movie/${movie}`],
    ['MOV vidsrc.cc', `https://vidsrc.cc/v2/embed/movie/${movie}`],
    ['MOV vidsrc.xyz', `https://vidsrc.xyz/embed/movie/${movie}`],
    ['MOV vidfast.pro', `https://vidfast.pro/movie/${movie}`],
    ['MOV embed.su', `https://embed.su/embed/movie/${movie}`],
    ['MOV autoembed', `https://player.autoembed.cc/embed/movie/${movie}`],
    ['MOV 111movies', `https://111movies.com/movie/${movie}`],
    ['MOV vidlink', `https://vidlink.pro/movie/${movie}`],
    ['MOV moviesapi', `https://moviesapi.club/movie/${movie}`],
    ['MOV superembed', `https://multiembed.mov/?video_id=${movie}&tmdb=1`],
    ['ANI vidsrc.cc', `https://vidsrc.cc/v2/embed/anime/${mal}/1/sub`],
    ['ANI vidlink', `https://vidlink.pro/anime/${mal}/1/sub`],
  ]
  const results = await Promise.all(targets.map(([l, u]) => test(l, u)))
  return NextResponse.json(
    { region: process.env.VERCEL_REGION, results },
    { headers: { 'cache-control': 'no-store' } }
  )
}
