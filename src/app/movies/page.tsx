import { getMovies } from '@/lib/scraper'
import AnimeGrid from '@/components/anime/AnimeGrid'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const maxDuration = 30
export const metadata: Metadata = { title: 'Anime Movies' }

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1', 10) || 1)
  const result = await getMovies(page)

  return (
    <div className="pt-16 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Anime Movies</h1>
      <AnimeGrid animes={result.data} />
      <Pagination currentPage={result.currentPage} hasNextPage={result.hasNextPage} basePath="/movies" />
    </div>
  )
}
