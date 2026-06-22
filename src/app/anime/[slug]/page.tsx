import Image from 'next/image'
import Link from 'next/link'
import { getAnimeDetail } from '@/lib/scraper'
import EpisodeList from '@/components/anime/EpisodeList'
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
  } catch {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Gagal memuat detail anime</p>
      </div>
    )
  }

  return (
    <div className="pt-16">
      <div className="relative w-full max-w-[1400px] mx-auto h-[40vh] md:h-[50vh] overflow-hidden">
        {detail.image && (
          <Image
            src={detail.image}
            alt={detail.title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 1400px"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="px-4 md:px-8 -mt-32 relative z-10 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="shrink-0 mx-auto md:mx-0">
            {detail.image && (
              <div className="relative w-[180px] md:w-[240px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={detail.image}
                  alt={detail.title}
                  fill
                  className="object-cover"
                  sizes="240px"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{detail.title}</h1>
            {detail.japanese && (
              <p className="text-text-secondary text-sm mb-4">{detail.japanese}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {detail.genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/genre/${genre.toLowerCase()}`}
                  className="px-3 py-1 bg-surface border border-border rounded-full text-xs text-text-secondary hover:text-accent hover:border-accent transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {detail.rating && (
                <InfoItem label="Rating" value={detail.rating} />
              )}
              {detail.type && (
                <InfoItem label="Type" value={detail.type} />
              )}
              {detail.status && (
                <InfoItem label="Status" value={detail.status} />
              )}
              {detail.studio && (
                <InfoItem label="Studio" value={detail.studio} />
              )}
              {detail.duration && (
                <InfoItem label="Duration" value={detail.duration} />
              )}
              {detail.season && (
                <InfoItem label="Season" value={detail.season} />
              )}
            </div>

            {detail.synopsis && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Synopsis</h2>
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{detail.synopsis}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <EpisodeList episodes={detail.episodes} />
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-xl p-3 border border-border">
      <div className="text-xs text-text-secondary mb-1">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}
