'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SITE_NAME } from '@/lib/constants'

const NAV_LINKS = [
  { href: '/ongoing', label: 'On-Going' },
  { href: '/completed', label: 'Completed' },
  { href: '/movies', label: 'Movies' },
  { href: '/film', label: 'Film' },
  { href: '/manga', label: 'Manga' },
  { href: '/genre', label: 'Genres' },
]

export default function Navbar() {
  const [search, setSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Solidify the bar once the page moves, so it never floats over the hero
  // without separation.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const query = search.trim()
    if (!query) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
    setSearch('')
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? 'glass-strong' : 'bg-gradient-to-b from-black/70 to-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 min-w-0">
          <Link
            href="/"
            className="font-display text-xl font-extrabold tracking-tight shrink-0"
          >
            <span className="text-text-primary">RAN</span>
            <span className="text-accent">Stream</span>
            <span className="sr-only">{SITE_NAME}</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-full text-sm transition-colors ${
                    active
                      ? 'text-accent font-semibold'
                      : 'text-text-secondary hover:text-text-primary font-medium'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        <form onSubmit={submit} role="search" className="flex items-center gap-2 min-w-0">
          <div className="relative hidden sm:block">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari anime, film, manga..."
              aria-label="Search"
              className="w-44 lg:w-60 pl-9 pr-4 py-2 glass rounded-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>
          <Link
            href="/search"
            aria-label="Open search page"
            className="sm:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
        </form>
      </div>
    </nav>
  )
}
