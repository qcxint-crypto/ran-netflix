import { getGenreAnime } from '@/lib/scraper'
import AnimeGrid from '@/components/anime/AnimeGrid'
import Pagination from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export default async function GenreAnimePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1', 10) || 1)

  let result
  try {
    result = await getGenreAnime(slug, page)
  } catch {
    return (
      <div className="pt-16 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
        <p className="text-text-secondary text-center py-20">Gagal memuat data</p>
      </div>
    )
  }

  const genreName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')

  return (
    <div className="pt-16 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Genre: {genreName}</h1>
      <AnimeGrid animes={result.data} />
      <Pagination currentPage={result.currentPage} hasNextPage={result.hasNextPage} basePath={`/genre/${slug}`} />
    </div>
  )
}
