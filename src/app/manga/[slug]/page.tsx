import Image from 'next/image'
import { getMangaDetailPage } from '@/lib/scraper'
import ChapterList from '@/components/manga/ChapterList'
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
    const detail = await getMangaDetailPage(slug)
    return { title: detail.title }
  } catch {
    return { title: 'Manga Detail' }
  }
}

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let detail
  try {
    detail = await getMangaDetailPage(slug)
  } catch {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Gagal memuat detail manga</p>
      </div>
    )
  }

  return (
    <div className="pt-16">
      <div className="relative w-full max-w-[1400px] mx-auto h-[30vh] md:h-[40vh] overflow-hidden">
        {detail.image && (
          <Image
            src={detail.image}
            alt={detail.title}
            fill
            className="object-cover object-center blur-sm scale-110"
            sizes="(max-width: 768px) 100vw, 1400px"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
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

            <div className="flex flex-wrap gap-2 mb-4">
              {detail.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-surface border border-border rounded-full text-xs text-text-secondary"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {detail.type && <InfoItem label="Type" value={detail.type} />}
              {detail.status && <InfoItem label="Status" value={detail.status} />}
              {detail.author && <InfoItem label="Author" value={detail.author} />}
              <InfoItem label="Chapters" value={`${detail.chapters.length}`} />
            </div>

            {detail.synopsis && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Synopsis</h2>
                <p className="text-sm text-text-secondary leading-relaxed">{detail.synopsis}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <ChapterList chapters={detail.chapters} mangaSlug={slug} />
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
