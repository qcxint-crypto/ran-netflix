'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { MangaChapterItem } from '@/types'

export default function ChapterList({
  chapters,
  mangaSlug,
  currentSlug,
}: {
  chapters: MangaChapterItem[]
  mangaSlug: string
  currentSlug?: string
}) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const filtered = chapters.filter((ch) =>
    ch.title.toLowerCase().includes(search.toLowerCase())
  )

  const displayed = showAll ? filtered : filtered.slice(0, 30)

  return (
    <div className="bg-surface rounded-xl border border-border">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold mb-3">Daftar Chapter</h3>
        <input
          type="text"
          placeholder="Cari chapter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
        />
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {displayed.map((ch) => (
          <Link
            key={ch.slug}
            href={`/manga/${mangaSlug}/${ch.slug}`}
            className={`flex items-center px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border/50 last:border-0 ${
              currentSlug === ch.slug ? 'bg-accent/10 text-accent' : ''
            }`}
          >
            <span className="text-sm truncate">{ch.title}</span>
          </Link>
        ))}
      </div>
      {filtered.length > 30 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-sm text-accent hover:bg-surface-hover transition-colors border-t border-border"
        >
          Lihat semua ({filtered.length} chapter)
        </button>
      )}
    </div>
  )
}
