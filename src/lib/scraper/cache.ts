interface CacheEntry<T> {
  data: T
  expires: number
  staleExpires: number
}

const store = new Map<string, CacheEntry<unknown>>()
const MAX_ENTRIES = 200
const STALE_MULTIPLIER = 6

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expires) {
    return null
  }
  return entry.data
}

export function cacheGetStale<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.staleExpires) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  if (store.size >= MAX_ENTRIES) {
    const firstKey = store.keys().next().value
    if (firstKey) store.delete(firstKey)
  }
  const now = Date.now()
  store.set(key, {
    data,
    expires: now + ttlMs,
    staleExpires: now + ttlMs * STALE_MULTIPLIER,
  })
}
