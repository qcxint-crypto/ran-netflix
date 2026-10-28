'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import type { AnimeCard } from '@/types'

export default function AnimeListPage() {
  const [animes, setAnimes] = useState<AnimeCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/home')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        setAnimes([...(json.data?.ongoing || []), ...(json.data?.completed || [])])
      })
      .catch(() => {
        if (!cancelled) setAnimes([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    // Sorted once up front rather than on every keystroke.
    const sorted = [...animes].sort((a, b) => a.title.localeCompare(b.title))
    if (!needle) return sorted
    return sorted.filter((a) => a.title.toLowerCase().includes(needle))
  }, [animes, filter])

  return (
    <div className="pt-16 px-4 md:px-8 py-10 max-w-[1400px] mx-auto">
      <PageHeader title="Anime List" meta={`${filtered.length} titles`} />

      <input
        type="search"
        placeholder="Filter anime..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label="Filter anime"
        className="w-full max-w-md px-4 py-2.5 mb-7 glass rounded-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
          {Array.from({ length: 24 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-text-secondary text-center py-16">Tidak ada anime ditemukan</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
          {filtered.map((anime) => (
            <Link
              key={anime.slug}
              href={`/anime/${anime.slug}`}
              className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl hover:bg-surface/70 transition-colors"
            >
              <span className="text-sm text-text-secondary group-hover:text-accent transition-colors truncate">
                {anime.title}
              </span>
              {anime.episode && (
                <span className="text-xs text-text-muted shrink-0">{anime.episode}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
