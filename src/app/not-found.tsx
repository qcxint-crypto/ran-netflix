import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="pt-16 flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-6xl font-extrabold text-accent mb-4">404</h1>
      <p className="text-xl text-text-secondary mb-6">Page not found</p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-full transition-colors font-semibold"
      >
        Back to Home
      </Link>
    </div>
  )
}
