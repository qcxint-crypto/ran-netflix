import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="pt-16 flex flex-col items-center justify-center min-h-screen text-center px-4">
      <p className="font-display text-7xl md:text-9xl font-extrabold text-accent/90 leading-none mb-3">
        404
      </p>
      <p className="text-lg text-text-secondary mb-8">Halaman tidak ditemukan</p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-accent hover:bg-accent-hover text-black rounded-full text-sm font-bold transition-colors"
        >
          Back to Home
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 glass rounded-full text-sm font-semibold hover:border-white/25 transition-colors"
        >
          Search
        </Link>
      </div>
    </div>
  )
}
