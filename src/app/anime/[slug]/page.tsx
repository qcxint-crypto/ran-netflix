import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getAnimeDetail, NotFoundError } from '@/lib/scraper'
import EpisodeList from '@/components/anime/EpisodeList'
import DetailBackdrop from '@/components/ui/DetailBackdrop'
import InfoItem from '@/components/ui/InfoItem'
import AddToListButton from '@/components/watchlist/AddToListButton'
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
    const detail = await getAnimeDetail(slug)
    return { title: detail.title }
  } catch {
    return { title: 'Anime Detail' }
  }
}

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let detail
  try {
    detail = await getAnimeDetail(slug)
  } catch (err) {
    // A missing title is a 404, not a render error.
    if (err instanceof NotFoundError) notFound()
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Gagal memuat detail anime</p>
      </div>
    )
  }

  return (
    <div className="pt-16">
      <DetailBackdrop image={detail.image} alt={detail.title} />

      <div className="px-4 md:px-8 -mt-32 md:-mt-40 relative max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="shrink-0 mx-auto md:mx-0">
            {detail.image && (
              <div className="poster-card relative w-[170px] md:w-[240px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.95)]">
                <Image
                  src={detail.image}
                  alt={detail.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="240px"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl md:text-4xl font-extrabold mb-2 text-balance">
              {detail.title}
            </h1>
            {detail.japanese && (
              <p className="text-text-secondary text-sm mb-4">{detail.japanese}</p>
            )}

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <AddToListButton
                slug={slug}
                title={detail.title}
                image={detail.image}
                totalEpisodes={detail.episodes.length}
              />
              {detail.malId && (
                <a
                  href={`https://myanimelist.net/anime/${detail.malId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                >
                  MyAnimeList
                  {detail.malScore && (
                    <span className="px-1.5 py-0.5 rounded bg-accent/15 text-accent text-xs font-semibold">
                      {detail.malScore}
                    </span>
                  )}
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {detail.genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/genre/${genre.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-3 py-1 glass rounded-full text-xs text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {detail.rating && <InfoItem label="Rating" value={detail.rating} />}
              {detail.type && <InfoItem label="Type" value={detail.type} />}
              {detail.status && <InfoItem label="Status" value={detail.status} />}
              {detail.studio && <InfoItem label="Studio" value={detail.studio} />}
              {detail.duration && <InfoItem label="Duration" value={detail.duration} />}
              {detail.season && <InfoItem label="Season" value={detail.season} />}
            </div>

            {detail.synopsis && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-text-muted mb-2">
                  Synopsis
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                  {detail.synopsis}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <EpisodeList episodes={detail.episodes} />
        </div>
      </div>
    </div>
  )
}
