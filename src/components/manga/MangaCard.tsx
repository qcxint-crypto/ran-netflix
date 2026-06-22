import Link from 'next/link'
import Image from 'next/image'
import type { MangaCard as MangaCardType } from '@/types'

export default function MangaCard({ manga }: { manga: MangaCardType }) {
  return (
    <Link href={`/manga/${manga.slug}`} className="group block">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface">
        {manga.image ? (
          <Image
            src={manga.image}
            alt={manga.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 180px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-text-secondary text-sm">No Image</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded uppercase tracking-wide">
          {manga.type || 'MANGA'}
        </span>

        {manga.chapter && (
          <span className="absolute bottom-10 left-2.5 px-2 py-0.5 bg-blue-600/90 text-white text-[11px] font-semibold rounded">
            {manga.chapter}
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight drop-shadow-md">
            {manga.title}
          </h3>
        </div>
      </div>
    </Link>
  )
}
