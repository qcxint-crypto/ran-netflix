import Link from 'next/link'
import Image from 'next/image'
import type { AnimeCard } from '@/types'

export default function HeroBanner({ anime }: { anime: AnimeCard }) {
  return (
    <div className="px-4 md:px-8 pt-4">
      <div className="relative w-full max-w-[1400px] mx-auto rounded-2xl overflow-hidden" style={{ aspectRatio: '21/9' }}>
        {anime.image && (
          <Image
            src={anime.image}
            alt={anime.title}
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 1400px"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 max-w-md z-10">
          <span className="inline-block px-3 py-1 bg-accent text-white text-xs font-bold rounded-full uppercase tracking-wider mb-3">
            Spotlight
          </span>
          <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold mb-2 leading-tight drop-shadow-lg">
            {anime.title}
          </h1>
          <div className="flex items-center gap-2 mb-4 text-sm">
            {anime.rating && (
              <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {anime.rating}
              </span>
            )}
            {anime.rating && anime.status && <span className="text-text-secondary">•</span>}
            {anime.status && <span className="text-text-secondary">{anime.status}</span>}
            {anime.episode && (
              <>
                <span className="text-text-secondary">•</span>
                <span className="text-text-secondary">Episode {anime.episode}</span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/anime/${anime.slug}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-full font-semibold transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Watch Now
            </Link>
            <Link
              href={`/anime/${anime.slug}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white rounded-full font-semibold transition-colors text-sm border border-white/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
