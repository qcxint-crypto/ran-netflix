import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="hidden md:block bg-surface border-t border-border mt-12">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-extrabold mb-3">
              <span className="text-white">RAN</span>
              <span className="text-accent">Stream</span>
            </h3>
            <p className="text-sm text-text-secondary">
              Streaming anime, baca manga, dan nonton film gratis dengan kualitas terbaik.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Navigation</h4>
            <div className="flex flex-col gap-2 text-sm text-text-secondary">
              <Link href="/ongoing" className="hover:text-text-primary transition-colors">On-Going</Link>
              <Link href="/completed" className="hover:text-text-primary transition-colors">Completed</Link>
              <Link href="/anime" className="hover:text-text-primary transition-colors">Anime List</Link>
              <Link href="/genre" className="hover:text-text-primary transition-colors">Genres</Link>
              <Link href="/movies" className="hover:text-text-primary transition-colors">Movies</Link>
              <Link href="/manga" className="hover:text-text-primary transition-colors">Manga</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Info</h4>
            <p className="text-sm text-text-secondary">
              All videos are sourced from third parties. We do not store video files on our servers.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
