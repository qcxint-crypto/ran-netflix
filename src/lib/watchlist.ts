/**
 * Watchlist storage: pure data helpers, no React.
 *
 * Everything lives in localStorage under a versioned key. Bump the version
 * suffix whenever the stored shape changes; older payloads are dropped by the
 * shape validation in `readWatchlist` rather than half-migrated.
 */

export const WATCHLIST_KEY = 'ranstream:watchlist:v1'

export type WatchStatus = 'watching' | 'completed' | 'plan' | 'onhold' | 'dropped'

export interface WatchlistItem {
  /** Same value as `slug` — slugs are already unique per title locally. */
  id: string
  slug: string
  title: string
  image: string
  status: WatchStatus
  /** Episodes watched so far. */
  progress: number
  /** 0 when the provider does not report an episode count. */
  totalEpisodes: number
  /** 0-10, or null when unrated. */
  score: number | null
  notes: string
  /** Epoch ms of the last edit; drives the "Recently updated" sort. */
  updatedAt: number
}

export const STATUS_ORDER: WatchStatus[] = [
  'watching',
  'completed',
  'plan',
  'onhold',
  'dropped',
]

export const STATUS_LABELS: Record<WatchStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  plan: 'Plan to Watch',
  onhold: 'On Hold',
  dropped: 'Dropped',
}

/** Guard rails for imported data, which is a trust boundary. */
const LIMITS = { title: 300, slug: 200, image: 2000, notes: 1000 }

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function int(value: unknown, max: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(Math.max(Math.trunc(n), 0), max)
}

/**
 * Coerce one unknown record into a valid item, or null when it is unusable.
 * Anything imported from a file or read from a stale key passes through here.
 */
export function normalizeItem(raw: unknown): WatchlistItem | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  const slug = str(r.slug, LIMITS.slug) || str(r.id, LIMITS.slug)
  if (!slug) return null

  const status = STATUS_ORDER.includes(r.status as WatchStatus)
    ? (r.status as WatchStatus)
    : 'plan'

  const rawScore = typeof r.score === 'number' ? r.score : Number(r.score)
  const score =
    r.score === null || r.score === undefined || !Number.isFinite(rawScore)
      ? null
      : Math.min(Math.max(rawScore, 0), 10)

  return {
    id: slug,
    slug,
    title: str(r.title, LIMITS.title) || slug,
    image: str(r.image, LIMITS.image),
    status,
    progress: int(r.progress, 100000),
    totalEpisodes: int(r.totalEpisodes, 100000),
    score,
    notes: str(r.notes, LIMITS.notes),
    updatedAt: Number.isFinite(r.updatedAt as number) ? (r.updatedAt as number) : Date.now(),
  }
}

/** Deduplicate by slug, keeping the most recently updated copy. */
export function normalizeList(raw: unknown): WatchlistItem[] {
  if (!Array.isArray(raw)) return []
  const bySlug = new Map<string, WatchlistItem>()
  for (const entry of raw) {
    const item = normalizeItem(entry)
    if (!item) continue
    const existing = bySlug.get(item.slug)
    if (!existing || item.updatedAt > existing.updatedAt) bySlug.set(item.slug, item)
  }
  return Array.from(bySlug.values())
}

export function readWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(WATCHLIST_KEY)
    if (!raw) return []
    return normalizeList(JSON.parse(raw))
  } catch {
    // Corrupt payload: start clean rather than crash the whole page.
    return []
  }
}

export function writeWatchlist(items: WatchlistItem[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items))
  } catch {
    // Quota exceeded or storage disabled. The UI keeps working in memory.
  }
}

export function serialiseWatchlist(items: WatchlistItem[]): string {
  return JSON.stringify({ version: 1, items }, null, 2)
}

export function parseWatchlistFile(text: string): WatchlistItem[] {
  const parsed = JSON.parse(text)
  // Accept both the exported envelope and a bare array.
  const raw = Array.isArray(parsed) ? parsed : parsed?.items
  return normalizeList(raw)
}

export interface WatchlistStats {
  total: number
  watching: number
  completed: number
  meanScore: number | null
}

export function computeStats(items: WatchlistItem[]): WatchlistStats {
  const scored = items.filter((i) => i.score !== null).map((i) => i.score as number)
  return {
    total: items.length,
    watching: items.filter((i) => i.status === 'watching').length,
    completed: items.filter((i) => i.status === 'completed').length,
    meanScore: scored.length
      ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10
      : null,
  }
}

/** Pull the episode number out of `anime-<malId>-episode-<n>`. */
export function episodeNumberFromSlug(slug: string): number | null {
  const match = slug.match(/-episode-(\d+)$/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return Number.isFinite(n) && n > 0 ? n : null
}
