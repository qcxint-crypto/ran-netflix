'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { MangaChapterItem } from '@/types'

const PREVIEW_COUNT = 30

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

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return chapters
    return chapters.filter((ch) => ch.title.toLowerCase().includes(needle))
  }, [chapters, search])

  const displayed = showAll ? filtered : filtered.slice(0, PREVIEW_COUNT)

  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className="p-4 md:p-5 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          Chapters
          <span className="ml-2 text-xs font-medium text-text-muted">{filtered.length}</span>
        </h2>
        <input
          type="search"
          placeholder="Cari chapter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search chapters"
          className="w-full sm:w-56 px-3 py-1.5 bg-background/60 border border-border rounded-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-border/40">
        {displayed.map((ch) => {
          const active = currentSlug === ch.slug
          return (
            <Link
              key={ch.slug}
              href={`/manga/${mangaSlug}/${ch.slug}`}
              aria-current={active ? 'page' : undefined}
              className={`px-4 py-3 text-sm truncate transition-colors ${
                active
                  ? 'bg-accent/15 text-accent font-semibold'
                  : 'bg-surface/40 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {ch.title}
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-text-secondary">Chapter tidak ditemukan</p>
      )}

      {filtered.length > PREVIEW_COUNT && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-sm font-medium text-accent hover:bg-surface-hover transition-colors border-t border-border/60"
        >
          Lihat semua {filtered.length} chapter
        </button>
      )}
    </section>
  )
}
