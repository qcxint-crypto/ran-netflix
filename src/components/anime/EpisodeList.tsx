'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { EpisodeItem } from '@/types'

const PREVIEW_COUNT = 24

export default function EpisodeList({
  episodes,
  currentSlug,
}: {
  episodes: EpisodeItem[]
  currentSlug?: string
}) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return episodes
    return episodes.filter((ep) => ep.title.toLowerCase().includes(needle))
  }, [episodes, search])

  const displayed = showAll ? filtered : filtered.slice(0, PREVIEW_COUNT)

  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className="p-4 md:p-5 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          Episodes
          <span className="ml-2 text-xs font-medium text-text-muted">{filtered.length}</span>
        </h2>
        <input
          type="search"
          placeholder="Cari episode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search episodes"
          className="w-full sm:w-56 px-3 py-1.5 bg-background/60 border border-border rounded-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-border/40">
        {displayed.map((ep) => {
          const active = currentSlug === ep.slug
          const number = ep.slug.match(/episode-(\d+)$/)?.[1] ?? ep.title.replace(/\D/g, '')
          return (
            <Link
              key={ep.slug}
              href={`/watch/${ep.slug}`}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center justify-between gap-2 px-3.5 py-3 text-sm transition-colors ${
                active
                  ? 'bg-accent/15 text-accent font-semibold'
                  : 'bg-surface/40 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <span className="truncate">Episode {number || ep.title}</span>
              {ep.date && <span className="text-[11px] text-text-muted shrink-0">{ep.date}</span>}
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-text-secondary">Episode tidak ditemukan</p>
      )}

      {filtered.length > PREVIEW_COUNT && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-sm font-medium text-accent hover:bg-surface-hover transition-colors border-t border-border/60"
        >
          Lihat semua {filtered.length} episode
        </button>
      )}
    </section>
  )
}
