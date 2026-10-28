import Link from 'next/link'
import { SITE_NAME } from '@/lib/constants'

const COLUMNS = [
  {
    title: 'Browse',
    links: [
      { href: '/ongoing', label: 'On-Going' },
      { href: '/completed', label: 'Completed' },
      { href: '/movies', label: 'Anime Movies' },
      { href: '/film', label: 'Film & Series' },
      { href: '/manga', label: 'Manga' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { href: '/anime', label: 'Anime List' },
      { href: '/genre', label: 'Genres' },
      { href: '/search', label: 'Search' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="hidden md:block relative z-10 mt-16 border-t border-border/60 glass">
      <div className="max-w-[1400px] mx-auto px-8 py-10">
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-2">
            <h3 className="font-display text-lg font-extrabold mb-3">
              <span className="text-text-primary">RAN</span>
              <span className="text-accent">Stream</span>
            </h3>
            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
              Streaming anime, baca manga, dan nonton film dengan kualitas terbaik.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted mb-3">
                {column.title}
              </h4>
              <div className="flex flex-col gap-2 text-sm text-text-secondary">
                {column.links.map((link) => (
                  <Link key={link.href} href={link.href} className="hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            {SITE_NAME} does not host any video files. All media is sourced from third parties.
          </p>
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </div>
    </footer>
  )
}
