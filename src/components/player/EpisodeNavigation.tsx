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
    <div className="flex items-center justify-between gap-3 mt-4">
      {prevSlug ? (
        <Link
          href={`/watch/${prevSlug}`}
          className="flex-1 text-center px-4 py-2.5 bg-surface hover:bg-surface-hover border border-border rounded-lg text-sm transition-colors"
        >
          &larr; Prev
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {animeSlug && (
        <Link
          href={`/anime/${animeSlug}`}
          className="px-4 py-2.5 bg-surface hover:bg-surface-hover border border-border rounded-lg text-sm transition-colors"
        >
          All Episodes
        </Link>
      )}
      {nextSlug ? (
        <Link
          href={`/watch/${nextSlug}`}
          className="flex-1 text-center px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm transition-colors"
        >
          Next &rarr;
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}
