import Link from 'next/link'

export default function EpisodeNavigation({
  prevSlug,
  nextSlug,
  animeSlug,
}: {
  prevSlug?: string
  nextSlug?: string
  animeSlug?: string
}) {
  return (
    <nav className="flex items-stretch gap-3 mt-4" aria-label="Episode navigation">
      {prevSlug ? (
        <Link
          href={`/watch/${prevSlug}`}
          className="flex-1 text-center px-4 py-3 glass rounded-xl text-sm hover:border-white/25 transition-colors"
        >
          &larr; Prev
        </Link>
      ) : (
        <span className="flex-1" />
      )}

      {animeSlug && (
        <Link
          href={`/anime/${animeSlug}`}
          className="px-4 py-3 glass rounded-xl text-sm text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
        >
          All Episodes
        </Link>
      )}

      {nextSlug ? (
        <Link
          href={`/watch/${nextSlug}`}
          className="flex-1 text-center px-4 py-3 bg-accent hover:bg-accent-hover text-black rounded-xl text-sm font-semibold transition-colors"
        >
          Next &rarr;
        </Link>
      ) : (
        <span className="flex-1" />
      )}
    </nav>
  )
}
