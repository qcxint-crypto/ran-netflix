import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Horizontally scrolling shelf. One component for anime, film and manga rows —
 * they only ever differed by which card they rendered.
 */
export default function PosterRow({
  title,
  href,
  children,
  accent,
}: {
  title: string
  href?: string
  children: ReactNode
  accent?: string
}) {
  return (
    <section className="py-7 md:py-9">
      <div className="flex items-end justify-between gap-4 mb-4 md:mb-5 px-4 md:px-8 max-w-[1400px] mx-auto">
        <h2 className="rule-accent text-lg md:text-2xl font-bold text-text-primary">
          {title}
          {accent && <span className="ml-2 text-sm font-medium text-text-muted">{accent}</span>}
        </h2>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-sm font-medium text-text-secondary hover:text-accent transition-colors"
          >
            View All &rarr;
          </Link>
        )}
      </div>
      <div className="overflow-x-auto scrollbar-hide px-4 md:px-8">
        <div className="flex gap-3.5 md:gap-4 pb-3 max-w-[1400px] mx-auto" style={{ width: 'max-content' }}>
          {children}
        </div>
      </div>
    </section>
  )
}

export function PosterRowItem({ children }: { children: ReactNode }) {
  return <div className="w-[142px] md:w-[180px] shrink-0">{children}</div>
}
