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
    const allowed = ['img.komiku.org', 'thumbnail.komiku.org', 'cdn.komiku.org']
    if (!allowed.some(h => parsed.hostname.endsWith(h))) {
      return new NextResponse('Domain not allowed', { status: 403 })
    }

    const res = await fetch(url, {
      headers: {
        'Referer': 'https://komiku.org/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

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
