import Link from 'next/link'
import { getGenres } from '@/lib/scraper'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const maxDuration = 30
export const metadata: Metadata = { title: 'Genre List' }

export default async function GenrePage() {
  let genres
  try {
    genres = await getGenres()
  } catch {
    return (
      <div className="pt-16 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
        <p className="text-text-secondary text-center py-20">Gagal memuat genre</p>
      </div>
    )
  }

  return (
    <div className="pt-16 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Genres</h1>
      <div className="flex flex-wrap gap-3">
        {genres.map((genre) => (
          <Link
            key={genre.slug}
            href={`/genre/${genre.slug}`}
            className="px-4 py-2 bg-surface border border-border rounded-full text-sm hover:border-accent hover:text-accent transition-colors"
          >
            {genre.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
