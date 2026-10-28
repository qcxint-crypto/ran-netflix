import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  try {
    const parsed = new URL(url)
    // Strict hostname allowlist — this route must never become an open proxy.
    // AniList and TMDB are included so the WebGL poster wall can read their
    // images as textures: both serve them fine in an <img>, but block
    // cross-origin canvas reads, which taints (and drops) a WebGL texture.
    const allowed = [
      'img.komiku.org',
      'thumbnail.komiku.org',
      'cdn.komiku.org',
      's4.anilist.co',
      'image.tmdb.org',
    ]
    const permitted = allowed.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))
    if (!permitted || parsed.protocol !== 'https:') {
      return new NextResponse('Domain not allowed', { status: 403 })
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, {
      headers: {
        'Referer': `${parsed.origin}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      return new NextResponse('Image fetch failed', { status: res.status })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch {
    return new NextResponse('Proxy error', { status: 500 })
  }
}
