import { getOngoing } from '@/lib/scraper'
import AnimeGrid from '@/components/anime/AnimeGrid'
import Pagination from '@/components/ui/Pagination'
import PageHeader from '@/components/ui/PageHeader'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const maxDuration = 30
export const metadata: Metadata = { title: 'On-Going Anime' }

export default async function OngoingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1', 10) || 1)

  let result
  try {
    result = await getOngoing(page)
  } catch {
    return (
      <div className="pt-16 px-4 md:px-8 py-10 max-w-[1400px] mx-auto">
        <p className="text-text-secondary text-center py-20">Gagal memuat data</p>
      </div>
    )
  }

  return (
    <div className="pt-16 px-4 md:px-8 py-10 max-w-[1400px] mx-auto">
      <PageHeader title="On-Going Anime" meta={`${result.data.length} titles`} />
      <AnimeGrid animes={result.data} />
      <Pagination currentPage={result.currentPage} hasNextPage={result.hasNextPage} basePath="/ongoing" />
    </div>
  )
}
