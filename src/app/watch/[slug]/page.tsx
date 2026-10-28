import Image from 'next/image'
import Link from 'next/link'
import { getEpisode, getAnimeDetail } from '@/lib/scraper'
import VideoPlayer from '@/components/player/VideoPlayer'
import WatchSidebar from '@/components/player/WatchSidebar'
import EpisodeNavigation from '@/components/player/EpisodeNavigation'
import AutoTrackProgress from '@/components/watchlist/AutoTrackProgress'
import { episodeNumberFromSlug } from '@/lib/watchlist'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

  // The slug encodes the episode number, so progress can be recorded from the
  // URL alone without trusting the scraped payload.
  const episodeNum = episodeNumberFromSlug(slug)

  let episode
  let animeDetail
  try {
    episode = await getEpisode(slug)
    if (episode.animeSlug) {
      try {
        animeDetail = await getAnimeDetail(episode.animeSlug)
      } catch {
        // Sidebar is a nice-to-have; the player still works without it.
      }
    }
  } catch {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Gagal memuat episode. Silakan coba lagi.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-accent hover:bg-accent-hover text-black rounded-full text-sm font-semibold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16">
      {/* Poster backdrop tints the whole player area with the title's colours. */}
      {animeDetail?.image && (
        <div className="absolute inset-x-0 top-16 h-[60vh]" aria-hidden>
          <Image
            src={animeDetail.image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-top opacity-[0.14] blur-2xl scale-110"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>
      )}

      {/* Records this episode as watched; renders nothing. */}
      {episode.animeSlug && episodeNum !== null && (
        <AutoTrackProgress
          slug={episode.animeSlug}
          episode={episodeNum}
          title={episode.animeTitle || episode.title}
          image={animeDetail?.image || ''}
          totalEpisodes={animeDetail?.episodes.length || 0}
        />
      )}

      <div className="relative px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1 min-w-0">
            <nav className="mb-3 text-xs text-text-muted" aria-label="Breadcrumb">
              {episode.animeSlug && (
                <>
                  <Link href={`/anime/${episode.animeSlug}`} className="hover:text-accent transition-colors">
                    {episode.animeTitle || 'Anime'}
                  </Link>
                  <span className="mx-2" aria-hidden>/</span>
                </>
              )}
              <span className="text-text-secondary">{episode.title}</span>
            </nav>

            <h1 className="font-display text-lg md:text-2xl font-bold mb-4">{episode.title}</h1>

            <VideoPlayer sources={episode.sources} poster={animeDetail?.image} note={episode.note} />

            <EpisodeNavigation
              prevSlug={episode.prevSlug}
              nextSlug={episode.nextSlug}
              animeSlug={episode.animeSlug}
            />
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
    </div>
  )
}
