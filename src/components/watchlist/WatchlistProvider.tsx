'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  WATCHLIST_KEY,
  computeStats,
  normalizeList,
  readWatchlist,
  writeWatchlist,
  type WatchStatus,
  type WatchlistItem,
  type WatchlistStats,
} from '@/lib/watchlist'

/** Fields a caller may set; everything else is derived or preserved. */
export type WatchlistInput = Partial<
  Pick<WatchlistItem, 'title' | 'image' | 'progress' | 'totalEpisodes' | 'score' | 'notes'>
> & { status?: WatchStatus }

interface WatchlistContextValue {
  items: WatchlistItem[]
  stats: WatchlistStats
  /** False until the first localStorage read finishes, so SSR and the first
   *  client render agree and React never reports a hydration mismatch. */
  ready: boolean
  get: (slug: string) => WatchlistItem | undefined
  upsert: (slug: string, input: WatchlistInput) => void
  /** Raises progress without ever lowering it — the watch page uses this. */
  bumpProgress: (slug: string, episode: number, input?: WatchlistInput) => void
  remove: (slug: string) => void
  replaceAll: (items: WatchlistItem[]) => void
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null)

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [ready, setReady] = useState(false)

  // Initial load. Runs after mount so the server-rendered markup and the first
  // client render are both the empty list.
  useEffect(() => {
    setItems(readWatchlist())
    setReady(true)
  }, [])

  const commit = useCallback((next: WatchlistItem[]) => {
    setItems(next)
    writeWatchlist(next)
  }, [])

  // Keep other tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== WATCHLIST_KEY) return
      setItems(readWatchlist())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const upsert = useCallback(
    (slug: string, input: WatchlistInput) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.slug === slug)
        const merged: WatchlistItem = {
          id: slug,
          slug,
          title: input.title ?? existing?.title ?? slug,
          image: input.image ?? existing?.image ?? '',
          status: input.status ?? existing?.status ?? 'plan',
          progress: input.progress ?? existing?.progress ?? 0,
          totalEpisodes: input.totalEpisodes ?? existing?.totalEpisodes ?? 0,
          score: input.score !== undefined ? input.score : existing?.score ?? null,
          notes: input.notes ?? existing?.notes ?? '',
          updatedAt: Date.now(),
        }
        const next = [merged, ...prev.filter((i) => i.slug !== slug)]
        writeWatchlist(next)
        return next
      })
    },
    [],
  )

  const bumpProgress = useCallback(
    (slug: string, episode: number, input?: WatchlistInput) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.slug === slug)
        const merged: WatchlistItem = {
          id: slug,
          slug,
          title: input?.title ?? existing?.title ?? slug,
          image: input?.image ?? existing?.image ?? '',
          // An untouched title starts as "watching"; an existing one keeps its
          // status so a completed title is not silently reopened.
          status: input?.status ?? existing?.status ?? 'watching',
          progress: Math.max(existing?.progress ?? 0, episode),
          totalEpisodes: input?.totalEpisodes ?? existing?.totalEpisodes ?? 0,
          score: existing?.score ?? null,
          notes: existing?.notes ?? '',
          updatedAt: Date.now(),
        }
        const next = [merged, ...prev.filter((i) => i.slug !== slug)]
        writeWatchlist(next)
        return next
      })
    },
    [],
  )

  const remove = useCallback(
    (slug: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.slug !== slug)
        writeWatchlist(next)
        return next
      })
    },
    [],
  )

  const replaceAll = useCallback(
    (incoming: WatchlistItem[]) => {
      // Normalise again: an imported file is untrusted input.
      commit(normalizeList(incoming))
    },
    [commit],
  )

  const value = useMemo<WatchlistContextValue>(
    () => ({
      items,
      stats: computeStats(items),
      ready,
      get: (slug) => items.find((i) => i.slug === slug),
      upsert,
      bumpProgress,
      remove,
      replaceAll,
    }),
    [items, ready, upsert, bumpProgress, remove, replaceAll],
  )

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be used inside <WatchlistProvider>')
  return ctx
}
