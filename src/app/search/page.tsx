'use client'

import { useState, useEffect, Suspense } from 'react'
import AnimeGrid from '@/components/anime/AnimeGrid'
import { GridSkeleton } from '@/components/ui/Skeleton'
import type { AnimeCard } from '@/types'
import { useSearchParams } from 'next/navigation'

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<AnimeCard[]>([])
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
      setResults(json.data || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(query)
  }

  return (
    <div className="pt-16 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Search Anime</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3 max-w-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type anime title..."
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
            {results.length} results found for &quot;{initialQuery || query}&quot;
          </p>
          <AnimeGrid animes={results} />
        </>
      ) : (
        <p className="text-text-secondary text-center py-20">
          Type an anime title to start searching
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
