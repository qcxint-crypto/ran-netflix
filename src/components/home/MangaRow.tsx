'use client'

import Link from 'next/link'
import type { MangaCard as MangaCardType } from '@/types'
import MangaCard from '@/components/manga/MangaCard'

export default function MangaRow({
  title,
  mangas,
  href,
}: {
  title: string
  mangas: MangaCardType[]
  href?: string
}) {
  if (mangas.length === 0) return null

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
          {mangas.map((manga) => (
            <div key={manga.slug} className="w-[150px] md:w-[180px] shrink-0">
              <MangaCard manga={manga} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
