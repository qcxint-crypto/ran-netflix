import type { ReactNode } from 'react'

const GRID_CLASSES =
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5'

/**
 * Grid of poster cards. Shared by anime / film / manga list pages, which
 * previously each carried an identical copy of this layout.
 */
export default function PosterGrid({
  children,
  isEmpty,
  emptyMessage = 'Tidak ada data ditemukan',
}: {
  children: ReactNode
  isEmpty: boolean
  emptyMessage?: string
}) {
  if (isEmpty) {
    return <div className="text-center py-20 text-text-secondary">{emptyMessage}</div>
  }
  return <div className={GRID_CLASSES}>{children}</div>
}
