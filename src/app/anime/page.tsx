'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { AnimeCard } from '@/types'

export default function AnimeListPage() {
  const [animes, setAnimes] = useState<AnimeCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/home')
      .then((res) => res.json())
      .then((json) => {
        const all = [...(json.data?.ongoing || []), ...(json.data?.completed || [])]
        setAnimes(all)
      })
      .catch(() => setAnimes([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter
    ? animes.filter((a) => a.title.toLowerCase().includes(filter.toLowerCase()))
    : animes

  return (
    <div className="pt-16 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Anime List</h1>

      <input
        type="text"
        placeholder="Filter anime..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 mb-6 bg-surface border border-border rounded-full text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-text-secondary"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="animate-pulse bg-surface h-10 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {filtered.map((anime) => (
            <Link
              key={anime.slug}
              href={`/anime/${anime.slug}`}
              className="px-4 py-3 hover:bg-surface rounded-lg transition-colors text-sm"
            >
              <span className="text-text-primary hover:text-accent transition-colors">{anime.title}</span>
              {anime.episode && (
                <span className="text-text-secondary ml-2 text-xs">Ep {anime.episode}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
