'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { AnimeDetail } from '@/types'

export default function WatchSidebar({
  anime,
  animeSlug,
  currentEpisodeSlug,
}: {
  anime: AnimeDetail
  animeSlug: string
  currentEpisodeSlug: string
}) {
  const [query, setQuery] = useState('')

  // Newest first: episode 12 matters more than episode 1 when you are watching.
  const episodes = useMemo(() => {
    const reversed = [...anime.episodes].reverse()
    const needle = query.trim().toLowerCase()
    if (!needle) return reversed
    return reversed.filter((ep) => ep.title.toLowerCase().includes(needle))
  }, [anime.episodes, query])

  return (
    <aside className="w-full lg:w-[340px] shrink-0">
      <div className="lg:sticky lg:top-20 space-y-4">
        <div className="glass rounded-2xl overflow-hidden">
          <Link href={`/anime/${animeSlug}`} className="block relative aspect-[16/9] overflow-hidden group">
            {anime.image && (
              <Image
                src={anime.image}
                alt={anime.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-cinema"
                sizes="340px"
                unoptimized
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h2 className="font-display font-bold text-sm leading-snug line-clamp-2 text-white">
                {anime.title}
              </h2>
            </div>
          </Link>

          <div className="p-4 border-b border-border/60">
            <div className="flex flex-wrap gap-2 text-xs">
              {anime.rating && (
                <span className="flex items-center gap-1 font-semibold text-accent">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {anime.rating}
                </span>
              )}
              {anime.status && (
                <span className="px-2 py-0.5 bg-background/60 rounded-full text-text-secondary">
                  {anime.status}
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                Episodes
              </h3>
              <span className="text-xs text-text-muted">{anime.episodes.length}</span>
            </div>

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari episode..."
              aria-label="Search episodes in sidebar"
              className="w-full px-3 py-1.5 mb-3 bg-background/60 border border-border rounded-full text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors"
            />

            <div className="max-h-[380px] overflow-y-auto space-y-1 pr-0.5">
              {episodes.map((ep) => {
                const isActive = ep.slug === currentEpisodeSlug
                const number = ep.slug.match(/episode-(\d+)$/)?.[1] ?? ep.title
                return (
                  <Link
                    key={ep.slug}
                    href={`/watch/${ep.slug}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-accent text-black font-semibold'
                        : 'bg-background/40 hover:bg-surface-hover text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="truncate">Episode {number}</span>
                    {isActive && (
                      <svg className="w-3 h-3 ml-2 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    )}
                  </Link>
                )
              })}
              {episodes.length === 0 && (
                <p className="py-6 text-center text-xs text-text-muted">Episode tidak ditemukan</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
