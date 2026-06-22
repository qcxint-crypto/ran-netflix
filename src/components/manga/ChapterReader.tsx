'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { MangaChapterData } from '@/types'

export default function ChapterReader({ chapter }: { chapter: MangaChapterData }) {
  return (
    <div>
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/manga/${chapter.mangaSlug}`}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back
          </Link>
          <h2 className="text-sm font-semibold truncate mx-4">{chapter.title}</h2>
          <div className="flex gap-2">
            {chapter.prevSlug && (
              <Link
                href={`/manga/${chapter.mangaSlug}/${chapter.prevSlug}`}
                className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs hover:bg-surface-hover transition-colors"
              >
                Prev
              </Link>
            )}
            {chapter.nextSlug && (
              <Link
                href={`/manga/${chapter.mangaSlug}/${chapter.nextSlug}`}
                className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs hover:bg-accent-hover transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {chapter.images.map((src, i) => (
          <div key={i} className="relative w-full">
            <Image
              src={src}
              alt={`Page ${i + 1}`}
              width={800}
              height={1200}
              className="w-full h-auto"
              unoptimized
              loading={i < 3 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-center gap-4">
        {chapter.prevSlug && (
          <Link
            href={`/manga/${chapter.mangaSlug}/${chapter.prevSlug}`}
            className="px-5 py-2.5 bg-surface border border-border rounded-xl text-sm hover:bg-surface-hover transition-colors"
          >
            ← Previous Chapter
          </Link>
        )}
        {chapter.nextSlug && (
          <Link
            href={`/manga/${chapter.mangaSlug}/${chapter.nextSlug}`}
            className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Next Chapter →
          </Link>
        )}
      </div>
    </div>
  )
}
