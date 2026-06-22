import Link from 'next/link'
import Image from 'next/image'
import type { FilmCard as FilmCardType } from '@/types'

export default function FilmCard({ film }: { film: FilmCardType }) {
  return (
    <Link href={`/film/${film.slug}`} className="group block">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface">
        {film.image ? (
          <Image
            src={film.image}
            alt={film.title}
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

        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded uppercase tracking-wide">
          {film.episode ? 'SERIES' : 'FILM'}
        </span>

        {film.quality && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-yellow-500/90 text-black text-[10px] font-bold rounded">
            {film.quality}
          </span>
        )}

        {film.year && (
          <span className="absolute bottom-10 left-2.5 px-2 py-0.5 bg-accent/90 text-white text-[11px] font-semibold rounded">
            {film.year}
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight drop-shadow-md">
            {film.title}
          </h3>
        </div>
      </div>
    </Link>
  )
}
