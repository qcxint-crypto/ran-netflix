'use client'

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
  return (
    <div className="w-full lg:w-[340px] shrink-0">
      <div className="sticky top-20">
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <Link href={`/anime/${animeSlug}`} className="block relative aspect-[16/9] overflow-hidden group">
            {anime.image && (
              <Image
                src={anime.image}
                alt={anime.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="340px"
                unoptimized
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </Link>

          <div className="p-4 border-b border-border">
            <Link href={`/anime/${animeSlug}`}>
              <h2 className="font-bold text-base mb-2 hover:text-accent transition-colors line-clamp-2">
                {anime.title}
              </h2>
            </Link>
            {anime.synopsis && (
              <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                {anime.synopsis}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              {anime.rating && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {anime.rating}
                </span>
              )}
              {anime.status && (
                <span className="px-2 py-0.5 bg-background rounded text-text-secondary">
                  {anime.status}
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">Episodes</h3>
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {anime.episodes.map((ep, index) => {
                const isActive = ep.slug === currentEpisodeSlug
                const episodeNumber = anime.episodes.length - index
                return (
                  <Link
                    key={ep.slug}
                    href={`/watch/${ep.slug}`}
                    className={`block px-3 py-2 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-accent text-white font-medium'
                        : 'bg-background hover:bg-surface-hover text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Episode {episodeNumber}</span>
                      {isActive && (
                        <svg className="w-3 h-3 ml-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
