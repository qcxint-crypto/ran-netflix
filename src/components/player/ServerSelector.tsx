'use client'

import type { StreamingSource } from '@/types'

const QUALITY_ORDER = ['1080p', '720p', '480p', '360p', '240p', '144p', 'default', 'unknown']

/** Groups sources by quality, and sorts both the groups and their contents. */
function groupByQuality(sources: StreamingSource[]) {
  const groups = new Map<string, StreamingSource[]>()
  for (const source of sources) {
    const key = source.quality || 'unknown'
    const list = groups.get(key)
    if (list) list.push(source)
    else groups.set(key, [source])
  }
  return Array.from(groups.entries()).sort((a, b) => {
    const ia = QUALITY_ORDER.indexOf(a[0])
    const ib = QUALITY_ORDER.indexOf(b[0])
    // Unknown qualities sort last rather than first.
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
}

export default function ServerSelector({
  sources,
  activeSource,
  onSelect,
}: {
  sources: StreamingSource[]
  activeSource: StreamingSource
  onSelect: (source: StreamingSource) => void
}) {
  const groups = groupByQuality(sources)

  return (
    <div className="glass rounded-b-2xl border-t-0 p-3 md:p-4">
      <div className="flex flex-wrap gap-4">
        {groups.map(([quality, list]) => (
          <div key={quality} className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] text-text-muted mb-1.5 font-semibold">
              {quality}
            </div>
            <div className="flex flex-wrap gap-2">
              {list.map((source) => {
                const active = activeSource.src === source.src
                return (
                  <button
                    key={source.src}
                    type="button"
                    onClick={() => onSelect(source)}
                    aria-pressed={active}
                    title={source.label}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 ${
                      active
                        ? 'bg-accent text-black border-accent font-semibold'
                        : 'bg-background/50 border-border text-text-secondary hover:border-accent/50 hover:text-text-primary'
                    }`}
                  >
                    {source.label.replace(source.quality, '').replace(/[-\s]+$/, '').trim() ||
                      `Server ${source.server}`}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
