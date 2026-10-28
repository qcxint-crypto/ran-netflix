'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AnimeGrid from '@/components/anime/AnimeGrid'
import FilmGrid from '@/components/film/FilmGrid'
import PageHeader from '@/components/ui/PageHeader'
import { GridSkeleton } from '@/components/ui/Skeleton'
import type { AnimeCard, FilmCard } from '@/types'

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [animeResults, setAnimeResults] = useState<AnimeCard[]>([])
  const [gogoResults, setGogoResults] = useState<AnimeCard[]>([])
  const [filmResults, setFilmResults] = useState<FilmCard[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const runSearch = useCallback(async (term: string) => {
    const q = term.trim()
    if (!q) return
    setLoading(true)
    setSearched(true)
    setGogoResults([])
    try {
      // Gogoanime is a separate upstream with its own latency; it fills in when
      // it gets there rather than holding the grid back.
      fetch(`/api/gogo/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((json) => setGogoResults(json.data || []))
        .catch(() => setGogoResults([]))

      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setAnimeResults(json.data?.anime || [])
      setFilmResults(json.data?.films || [])
    } catch {
      setAnimeResults([])
      setFilmResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialQuery) return
    setQuery(initialQuery)
    runSearch(initialQuery)
  }, [initialQuery, runSearch])

  const totalResults = animeResults.length + gogoResults.length + filmResults.length

  return (
    <div className="pt-16 px-4 md:px-8 py-10 max-w-[1400px] mx-auto">
      <PageHeader title="Search" subtitle="Cari anime, film, dan series" />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          runSearch(query)
        }}
        className="mb-9"
      >
        <div className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Naruto, Jujutsu Kaisen, ..."
              aria-label="Search query"
              className="w-full pl-11 pr-4 py-3 glass rounded-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-accent hover:bg-accent-hover text-black rounded-full transition-colors font-bold text-sm"
          >
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <GridSkeleton />
      ) : searched ? (
        <>
          <p className="text-sm text-text-secondary mb-6">
            {totalResults} results for &quot;{initialQuery || query}&quot;
          </p>

          {animeResults.length > 0 && (
            <section className="mb-10">
              <h2 className="rule-accent text-lg md:text-xl font-bold mb-5">Anime</h2>
              <AnimeGrid animes={animeResults} />
            </section>
          )}

          {filmResults.length > 0 && (
            <section className="mb-10">
              <h2 className="rule-accent text-lg md:text-xl font-bold mb-5">Film &amp; Series</h2>
              <FilmGrid films={filmResults} />
            </section>
          )}

          {gogoResults.length > 0 && (
            <section className="mb-10">
              <h2 className="rule-accent text-lg md:text-xl font-bold mb-5">
                Gogoanime
                <span className="ml-2 text-sm font-medium text-text-muted">
                  external source
                </span>
              </h2>
              <AnimeGrid animes={gogoResults} />
            </section>
          )}

          {totalResults === 0 && (
            <p className="text-text-secondary text-center py-14">Tidak ada hasil ditemukan</p>
          )}
        </>
      ) : (
        <p className="text-text-secondary text-center py-20">
          Ketik judul untuk mulai mencari
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
