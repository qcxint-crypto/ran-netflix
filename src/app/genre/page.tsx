import Link from 'next/link'
import { getGenres } from '@/lib/scraper'
import PageHeader from '@/components/ui/PageHeader'
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
      <div className="pt-16 px-4 md:px-8 py-10 max-w-[1400px] mx-auto">
        <p className="text-text-secondary text-center py-20">Gagal memuat genre</p>
      </div>
    )
  }

  return (
    <div className="pt-16 px-4 md:px-8 py-10 max-w-[1400px] mx-auto">
      <PageHeader title="Genres" subtitle="Browse anime by genre" />
      <div className="flex flex-wrap gap-3">
        {genres.map((genre, i) => (
          <Link
            key={genre.slug}
            href={`/genre/${genre.slug}`}
            style={{ animationDelay: `${Math.min(i, 20) * 25}ms` }}
            className="animate-fade-up px-4 py-2 glass rounded-full text-sm text-text-secondary hover:text-accent hover:border-accent/50 transition-all duration-300 hover:-translate-y-0.5"
          >
            {genre.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
