'use client'

import type { StreamingSource } from '@/types'

export default function ServerSelector({
  sources,
  activeSource,
  onSelect,
}: {
  sources: StreamingSource[]
  activeSource: StreamingSource
  onSelect: (source: StreamingSource) => void
}) {
  const qualityGroups = new Map<string, StreamingSource[]>()
  sources.forEach((s) => {
    const group = qualityGroups.get(s.quality) || []
    group.push(s)
    qualityGroups.set(s.quality, group)
  })

  const qualityOrder = ['1080p', '720p', '480p', '360p', '144p', 'default', 'unknown']
  const sortedQualities = Array.from(qualityGroups.keys()).sort(
    (a, b) => qualityOrder.indexOf(a) - qualityOrder.indexOf(b)
  )

  return (
    <div className="bg-surface border border-border border-t-0 rounded-b-xl p-3 md:p-4">
      <div className="flex flex-wrap gap-2 items-center mb-2">
        <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Kualitas:</span>
      </div>
      {sortedQualities.map((quality) => (
        <div key={quality} className="mb-3">
          <div className="text-xs text-text-secondary mb-1.5 font-medium">{quality.toUpperCase()}</div>
          <div className="flex flex-wrap gap-2">
            {qualityGroups.get(quality)!.map((source) => (
              <button
                key={source.src}
                onClick={() => onSelect(source)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  activeSource.src === source.src
                    ? 'bg-accent text-white'
                    : 'bg-background border border-border hover:border-accent text-text-secondary hover:text-text-primary'
                }`}
              >
                {source.label.replace(source.quality, '').replace('-', '').trim() || `Server ${source.server}`}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
