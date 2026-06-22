import { getEpisode, getAnimeDetail } from '@/lib/scraper'
import VideoPlayer from '@/components/player/VideoPlayer'
import WatchSidebar from '@/components/player/WatchSidebar'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const data = await getEpisode(slug)
    return { title: data.title }
  } catch {
    return { title: 'Watch Anime' }
  }
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let episode
  let animeDetail
  try {
    episode = await getEpisode(slug)
    if (episode.animeSlug) {
      try {
        animeDetail = await getAnimeDetail(episode.animeSlug)
      } catch {
        // Continue without anime details
      }
    }
  } catch {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Gagal memuat episode. Silakan coba lagi.</p>
      </div>
    )
  }

  return (
    <div className="pt-16 px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-bold mb-4">{episode.title}</h1>

          <VideoPlayer sources={episode.sources} />

          <div className="flex gap-3 mt-4">
            {episode.prevSlug && (
              <a
                href={`/watch/${episode.prevSlug}`}
                className="flex-1 text-center px-4 py-2.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-sm font-medium transition-colors"
              >
                ← Previous Episode
              </a>
            )}
            {episode.nextSlug && (
              <a
                href={`/watch/${episode.nextSlug}`}
                className="flex-1 text-center px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Next Episode →
              </a>
            )}
          </div>
        </div>

        {animeDetail && episode.animeSlug && (
          <WatchSidebar
            anime={animeDetail}
            animeSlug={episode.animeSlug}
            currentEpisodeSlug={slug}
          />
        )}
      </div>
    </div>
  )
}
