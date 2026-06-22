'use client'

import { useState, useEffect, Suspense } from 'react'
import AnimeGrid from '@/components/anime/AnimeGrid'
import FilmGrid from '@/components/film/FilmGrid'
import { GridSkeleton } from '@/components/ui/Skeleton'
import type { AnimeCard, FilmCard } from '@/types'
import { useSearchParams } from 'next/navigation'

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [animeResults, setAnimeResults] = useState<AnimeCard[]>([])
  const [filmResults, setFilmResults] = useState<FilmCard[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      doSearch(initialQuery)
    }
  }, [initialQuery])

  async function doSearch(q: string) {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      const json = await res.json()
      setAnimeResults(json.data?.anime || [])
      setFilmResults(json.data?.films || [])
    } catch {
      setAnimeResults([])
      setFilmResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(query)
  }

  const totalResults = animeResults.length + filmResults.length

  return (
    <div className="pt-16 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Search</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3 max-w-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, film & series..."
            className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-full text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-text-secondary"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-full transition-colors font-semibold"
          >
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <GridSkeleton />
      ) : searched ? (
        <>
          <p className="text-sm text-text-secondary mb-4">
            {totalResults} results found for &quot;{initialQuery || query}&quot;
          </p>

          {animeResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4">Anime</h2>
              <AnimeGrid animes={animeResults} />
            </div>
          )}

          {filmResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4">Film & Series</h2>
              <FilmGrid films={filmResults} />
            </div>
          )}

          {totalResults === 0 && (
            <p className="text-text-secondary text-center py-10">
              Tidak ada hasil ditemukan
            </p>
          )}
        </>
      ) : (
        <p className="text-text-secondary text-center py-20">
          Type a title to start searching
        </p>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <SearchContent />
    </Suspense>
  )
}
