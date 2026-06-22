'use client'

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
    <div className="flex items-center justify-center gap-4 mt-8">
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-5 py-2 bg-surface hover:bg-surface-hover border border-border rounded-lg transition-colors"
        >
          Prev
        </Link>
      )}
      <span className="text-text-secondary">Page {currentPage}</span>
      {hasNextPage && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-5 py-2 bg-surface hover:bg-surface-hover border border-border rounded-lg transition-colors"
        >
          Next
        </Link>
      )}
    </div>
  )
}
