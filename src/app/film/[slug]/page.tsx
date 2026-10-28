import Image from 'next/image'
import { getFilmDetail } from '@/lib/scraper'
import VideoPlayer from '@/components/player/VideoPlayer'
import DetailBackdrop from '@/components/ui/DetailBackdrop'
import InfoItem from '@/components/ui/InfoItem'
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
    const detail = await getFilmDetail(slug)
    return { title: detail.title }
  } catch {
    return { title: 'Film Detail' }
  }
}

export default async function FilmDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let detail
  try {
    detail = await getFilmDetail(slug)
  } catch {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Gagal memuat detail film</p>
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
            <h1 className="font-display text-2xl md:text-4xl font-extrabold mb-3 text-balance">
              {detail.title}
            </h1>

            {detail.genre && (
              <div className="flex flex-wrap gap-2 mb-5">
                {detail.genre.split(',').map((g) => (
                  <span key={g.trim()} className="px-3 py-1 glass rounded-full text-xs text-text-secondary">
                    {g.trim()}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {detail.rating && <InfoItem label="Rating" value={detail.rating} />}
              {detail.year && <InfoItem label="Year" value={detail.year} />}
              {detail.quality && <InfoItem label="Quality" value={detail.quality} />}
              {detail.duration && <InfoItem label="Duration" value={detail.duration} />}
            </div>

            {detail.synopsis && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-text-muted mb-2">
                  Synopsis
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">{detail.synopsis}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="rule-accent text-lg md:text-2xl font-bold mb-4">Watch</h2>
          <VideoPlayer sources={detail.sources} />
        </div>
      </div>
    </div>
  )
}
