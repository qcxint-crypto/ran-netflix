import Link from 'next/link'

export default function Pagination({
  currentPage,
  hasNextPage,
  basePath,
}: {
  currentPage: number
  hasNextPage: boolean
  basePath: string
}) {
  return (
    <nav className="flex items-center justify-center gap-4 mt-10" aria-label="Pagination">
      {currentPage > 1 ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          rel="prev"
          className="px-5 py-2.5 glass rounded-full text-sm hover:border-white/25 transition-colors"
        >
          &larr; Prev
        </Link>
      ) : (
        <span className="px-5 py-2.5 rounded-full text-sm text-text-muted cursor-not-allowed">
          &larr; Prev
        </span>
      )}

      <span className="text-sm text-text-secondary tabular-nums">Page {currentPage}</span>

      {hasNextPage ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          rel="next"
          className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-black rounded-full text-sm font-semibold transition-colors"
        >
          Next &rarr;
        </Link>
      ) : (
        <span className="px-5 py-2.5 rounded-full text-sm text-text-muted cursor-not-allowed">
          Next &rarr;
        </span>
      )}
    </nav>
  )
}
