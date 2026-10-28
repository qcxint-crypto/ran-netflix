import Link from 'next/link'
import Image from 'next/image'
import type { AnimeCard } from '@/types'
import HeroScene from '@/components/scene/HeroScene'

export default function HeroBanner({
  anime,
  posters,
}: {
  anime: AnimeCard
  /** Poster URLs for the 3D wall. Already CORS-safe (AniList / TMDB). */
  posters: string[]
}) {
  return (
    <section className="relative overflow-hidden">
      <HeroScene posters={posters} />

      {/* Blurred backdrop of the spotlight title, tinting the 3D scene with the
          poster's own colours instead of a flat black. */}
      {anime.image && (
        <div className="absolute inset-0">
          <Image
            src={anime.image}
            alt=""
            fill
            priority
            aria-hidden
            sizes="100vw"
            className="object-cover object-top opacity-20 blur-2xl scale-110"
            unoptimized
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/50 to-background" />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 pt-10 pb-14 md:pt-20 md:pb-24 min-h-[440px] md:min-h-[560px] flex items-center">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Spotlight
          </span>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.02] mb-5 text-balance drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
            {anime.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-7 text-sm text-text-secondary">
            {anime.rating && (
              <span className="font-semibold text-accent">
                {anime.rating.replace(/[^0-9.]/g, '')} score
              </span>
            )}
            {anime.status && (
              <>
                <span aria-hidden className="w-1 h-1 rounded-full bg-border-strong" />
                <span>{anime.status}</span>
              </>
            )}
            {anime.type && (
              <>
                <span aria-hidden className="w-1 h-1 rounded-full bg-border-strong" />
                <span>{anime.type}</span>
              </>
            )}
            {anime.episode && (
              <>
                <span aria-hidden className="w-1 h-1 rounded-full bg-border-strong" />
                <span>{anime.episode}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/anime/${anime.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-black rounded-full font-bold text-sm shadow-[0_10px_36px_-10px_rgba(232,176,75,0.75)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Watch Now
            </Link>
            <Link
              href={`/anime/${anime.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 glass hover:border-white/25 rounded-full font-semibold text-sm text-text-primary transition-all duration-300 hover:-translate-y-0.5"
            >
              Episode List
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
