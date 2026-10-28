'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useRef } from 'react'

export type PosterKind = 'anime' | 'film' | 'manga'

const KIND_STYLES: Record<PosterKind, { tag: string; dot: string }> = {
  anime: { tag: 'bg-accent text-black', dot: 'bg-accent' },
  film: { tag: 'bg-violet text-white', dot: 'bg-violet' },
  manga: { tag: 'bg-cyan text-black', dot: 'bg-cyan' },
}

export default function PosterCard({
  href,
  image,
  title,
  kind = 'anime',
  topLeft,
  topRight,
  bottom,
  rating,
  priority = false,
}: {
  href: string
  image?: string
  title: string
  kind?: PosterKind
  topLeft?: string
  topRight?: string
  bottom?: string
  rating?: string
  priority?: boolean
}) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const styles = KIND_STYLES[kind]

  /**
   * Writes the 3D rotation and the sheen origin straight to the element's
   * style. Going through React state here would re-render a whole row on every
   * pointer move.
   */
  const handleMove = useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
    const el = cardRef.current
    if (!el) return
    // Touch does not hover; skip the tilt entirely on coarse pointers.
    if (event.pointerType !== 'mouse') return

    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
    el.style.transform =
      `perspective(900px) rotateY(${(px - 0.5) * 11}deg) rotateX(${(0.5 - py) * 11}deg) ` +
      'translateY(-6px) scale(1.03)'
  }, [])

  const handleLeave = useCallback(() => {
    const el = cardRef.current
    if (!el) return
    el.style.transform = ''
    el.style.removeProperty('--mx')
    el.style.removeProperty('--my')
  }, [])

  return (
    <Link
      ref={cardRef}
      href={href}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onBlur={handleLeave}
      className="poster-card group relative block aspect-[3/4] rounded-xl overflow-hidden bg-surface border border-border/60 hover:border-white/20 hover:shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)]"
    >
      {image ? (
        <Image
          src={image}
          alt={title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 200px"
          className="object-cover transition-transform duration-500 ease-cinema group-hover:scale-[1.06]"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface to-background">
          <span className="text-text-muted text-xs">No Image</span>
        </div>
      )}

      {/* Bottom scrim keeps the title legible over any poster art. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
      <div className="poster-sheen absolute inset-0" />

      {topLeft && (
        <span
          className={`absolute top-2.5 left-2.5 px-2 py-0.5 ${styles.tag} text-[10px] font-bold rounded uppercase tracking-wide shadow-lg`}
        >
          {topLeft}
        </span>
      )}

      {topRight && (
        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 glass-strong text-[10px] font-semibold rounded text-text-primary">
          {topRight}
        </span>
      )}

      {rating && (
        <span className="absolute bottom-[52px] left-2.5 flex items-center gap-1 px-2 py-0.5 glass-strong rounded text-[11px] font-semibold text-accent">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {rating}
        </span>
      )}

      {bottom && (
        <span className="absolute bottom-10 left-2.5 px-2 py-0.5 glass-strong text-[11px] font-semibold rounded text-text-primary">
          {bottom}
        </span>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight drop-shadow-md">
          {title}
        </h3>
      </div>
    </Link>
  )
}
