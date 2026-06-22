'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [search, setSearch] = useState('')
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
      setShowMobileSearch(false)
      setSearch('')
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-extrabold tracking-tight flex items-baseline">
            <span className="text-white">RAN</span>
            <span className="text-accent">Stream</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-text-primary hover:text-accent transition-colors">
              Home
            </Link>
            <Link href="/ongoing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              On-Going
            </Link>
            <Link href="/completed" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Completed
            </Link>
            <Link href="/genre" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Genres
            </Link>
            <Link href="/anime" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Anime List
            </Link>
            <Link href="/movies" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Movies
            </Link>
            <Link href="/manga" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Manga
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
            <svg className="absolute left-3 w-4 h-4 text-text-secondary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search anime & manga..."
              className="w-56 pl-9 pr-4 py-2 bg-surface border border-border rounded-full text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-text-secondary transition-colors"
            />
          </form>

          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <button className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors" aria-label="Menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {showMobileSearch && (
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search anime & manga..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-full text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-text-secondary"
            />
          </form>
        </div>
      )}
    </nav>
  )
}
