'use client'

import { useEffect, useRef, useState } from 'react'
import { useWatchlist } from './WatchlistProvider'
import { STATUS_LABELS, STATUS_ORDER, type WatchStatus } from '@/lib/watchlist'

interface Props {
  slug: string
  title: string
  image: string
  totalEpisodes: number
}

/** "Add List" control for the anime detail page: a status dropdown in a popover. */
export default function AddToListButton({ slug, title, image, totalEpisodes }: Props) {
  const { get, upsert, remove, ready } = useWatchlist()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const item = ready ? get(slug) : undefined

  // Close on outside click / Escape, the way a native menu behaves.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const pick = (status: WatchStatus) => {
    upsert(slug, { status, title, image, totalEpisodes })
    setOpen(false)
  }

  // Render a stable placeholder until localStorage has been read, otherwise the
  // button would flash "Add List" for an item that is already on the list.
  if (!ready) {
    return <div className="h-10 w-32 rounded-full glass animate-pulse" aria-hidden />
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
          item
            ? 'bg-accent text-black hover:bg-accent-hover'
            : 'glass text-text-primary hover:border-accent/50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          {item ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          )}
        </svg>
        {item ? STATUS_LABELS[item.status] : 'Add List'}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-30 mt-2 left-0 w-52 glass-strong rounded-2xl border border-border/60 p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)]"
        >
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              role="menuitemradio"
              aria-checked={item?.status === status}
              onClick={() => pick(status)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                item?.status === status
                  ? 'text-accent font-semibold bg-accent/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
          {item && (
            <>
              <div className="my-1 h-px bg-border/60" />
              <button
                role="menuitem"
                onClick={() => {
                  remove(slug)
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Remove from list
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
