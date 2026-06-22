'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { EpisodeItem } from '@/types'

export default function EpisodeList({
  episodes,
  currentSlug,
}: {
  episodes: EpisodeItem[]
  currentSlug?: string
}) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const filtered = episodes.filter((ep) =>
    ep.title.toLowerCase().includes(search.toLowerCase())
  )

  const displayed = showAll ? filtered : filtered.slice(0, 20)

  return (
    <div className="bg-surface rounded-xl border border-border">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold mb-3">Daftar Episode</h3>
        <input
          type="text"
          placeholder="Cari episode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
        />
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {displayed.map((ep) => (
          <Link
            key={ep.slug}
            href={`/watch/${ep.slug}`}
            className={`flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border/50 last:border-0 ${
              currentSlug === ep.slug ? 'bg-accent/10 text-accent' : ''
            }`}
          >
            <span className="text-sm truncate flex-1">{ep.title}</span>
            {ep.date && (
              <span className="text-xs text-text-secondary ml-2 shrink-0">{ep.date}</span>
            )}
          </Link>
        ))}
      </div>
      {filtered.length > 20 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-sm text-accent hover:bg-surface-hover transition-colors border-t border-border"
        >
          Lihat semua ({filtered.length} episode)
        </button>
      )}
    </div>
  )
}
