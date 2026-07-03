import { NextResponse } from 'next/server'
import {
  searchOtakuDesu,
  getOtakuDesuEpisodes,
  getStreamingSources,
  findEpisodeUrl,
} from '@/lib/scraper/otakudesu-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Runs the REAL otakudesu pipeline stage-by-stage so we can see exactly
// where Vercel diverges from local. Query: /api/debug/probe?q=youjo%20senki&ep=1
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || 'youjo senki'
  const ep = parseInt(searchParams.get('ep') || '1', 10)

  const out: Record<string, unknown> = {
    region: process.env.VERCEL_REGION || 'unknown',
    query: q,
    episode: ep,
  }

  try {
    const search = await searchOtakuDesu(q)
    out.stage1_search = {
      count: search.length,
      first3: search.slice(0, 3).map((r) => ({ title: r.title, url: r.url })),
    }
    if (search.length === 0) return NextResponse.json(out)

    const animeUrl = search[0].url
    const episodes = await getOtakuDesuEpisodes(animeUrl)
    out.stage2_episodes = {
      animeUrl,
      count: episodes.length,
      sample: episodes.slice(0, 3).map((e) => ({ title: e.title, url: e.url })),
    }
    if (episodes.length === 0) return NextResponse.json(out)

    const epUrl = await findEpisodeUrl(q, ep)
    out.stage3_findEpisodeUrl = epUrl
    if (!epUrl) return NextResponse.json(out)

    const sources = await getStreamingSources(epUrl)
    out.stage4_sources = {
      count: sources.length,
      sources: sources.map((s) => ({ label: s.label, quality: s.quality, src: s.src })),
    }
  } catch (e) {
    out.error = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
    out.stack = e instanceof Error ? e.stack?.slice(0, 500) : undefined
  }

  return NextResponse.json(out, { headers: { 'cache-control': 'no-store' } })
}
