'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { MangaChapterData } from '@/types'

export default function ChapterReader({ chapter }: { chapter: MangaChapterData }) {
  return (
    <div>
      {/* Reader bar: solid enough to stay legible over the pages scrolling under
          it, but not a full-width slab that breaks the reading column. */}
      <div className="sticky top-16 z-40 glass-strong border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <Link
            href={`/manga/${chapter.mangaSlug}`}
            className="shrink-0 text-sm text-text-secondary hover:text-accent transition-colors"
          >
            &larr; Back
          </Link>
          <h2 className="text-xs sm:text-sm font-semibold truncate text-center">{chapter.title}</h2>
          <div className="flex gap-2 shrink-0">
            {chapter.prevSlug && (
              <Link
                href={`/manga/${chapter.mangaSlug}/${chapter.prevSlug}`}
                className="px-3 py-1.5 glass rounded-lg text-xs text-text-secondary hover:text-text-primary hover:border-white/25 transition-colors"
              >
                Prev
              </Link>
            )}
            {chapter.nextSlug && (
              <Link
                href={`/manga/${chapter.mangaSlug}/${chapter.nextSlug}`}
                className="px-3 py-1.5 bg-accent text-black rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {chapter.images.map((src, i) => (
          <div key={i} className="relative w-full bg-surface/30">
            <Image
              src={src}
              alt={`Page ${i + 1}`}
              width={800}
              height={1200}
              className="w-full h-auto"
              unoptimized
              // The first few pages are almost always seen; the rest can wait.
              loading={i < 3 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-center gap-3">
        {chapter.prevSlug && (
          <Link
            href={`/manga/${chapter.mangaSlug}/${chapter.prevSlug}`}
            className="px-5 py-2.5 glass rounded-xl text-sm hover:border-white/25 transition-colors"
          >
            &larr; Previous
          </Link>
        )}
        <Link
          href={`/manga/${chapter.mangaSlug}`}
          className="px-5 py-2.5 glass rounded-xl text-sm text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
        >
          Chapter List
        </Link>
        {chapter.nextSlug && (
          <Link
            href={`/manga/${chapter.mangaSlug}/${chapter.nextSlug}`}
            className="px-5 py-2.5 bg-accent text-black rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Next &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}
