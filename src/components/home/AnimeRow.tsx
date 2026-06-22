'use client'

import Link from 'next/link'
import type { AnimeCard as AnimeCardType } from '@/types'
import AnimeCard from '@/components/anime/AnimeCard'

export default function AnimeRow({
  title,
  animes,
  href,
}: {
  title: string
  animes: AnimeCardType[]
  href?: string
}) {
  if (animes.length === 0) return null

  return (
    <section className="py-6 md:py-8">
      <div className="flex items-center justify-between mb-4 md:mb-5 px-4 md:px-8 max-w-[1400px] mx-auto">
        <h2 className="text-lg md:text-xl font-extrabold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm text-accent hover:text-accent-hover font-medium transition-colors">
            View All &rarr;
          </Link>
        )}
      </div>
      <div className="overflow-x-auto scrollbar-hide px-4 md:px-8">
        <div className="flex gap-4 pb-2 max-w-[1400px] mx-auto" style={{ width: 'max-content' }}>
          {animes.map((anime) => (
            <div key={anime.slug} className="w-[150px] md:w-[180px] shrink-0">
              <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
