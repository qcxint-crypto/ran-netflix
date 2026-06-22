import { getMangaChapterPage, getMangaDetailPage } from '@/lib/scraper'
import ChapterReader from '@/components/manga/ChapterReader'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>
}): Promise<Metadata> {
  const { chapter } = await params
  const title = chapter.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return { title }
}

export default async function MangaChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>
}) {
  const { slug, chapter: chapterSlug } = await params

  let chapterData
  try {
    chapterData = await getMangaChapterPage(chapterSlug, slug)

    // Try to get manga detail for prev/next chapter navigation
    try {
      const detail = await getMangaDetailPage(slug)
      const chapters = detail.chapters
      const currentIdx = chapters.findIndex(ch => ch.slug === chapterSlug)
      if (currentIdx !== -1) {
        chapterData.prevSlug = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1].slug : undefined
        chapterData.nextSlug = currentIdx > 0 ? chapters[currentIdx - 1].slug : undefined
      }
    } catch {
      // Continue without prev/next
    }
  } catch {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Gagal memuat chapter. Silakan coba lagi.</p>
      </div>
    )
  }

  if (chapterData.images.length === 0) {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Chapter tidak tersedia.</p>
      </div>
    )
  }

  return (
    <div className="pt-16">
      <ChapterReader chapter={chapterData} />
    </div>
  )
}
