'use client'

import { useState } from 'react'
import type { StreamingSource } from '@/types'
import ServerSelector from './ServerSelector'

export default function VideoPlayer({ sources }: { sources: StreamingSource[] }) {
  const [activeSource, setActiveSource] = useState(sources[0] || null)

  if (!activeSource) {
    return (
      <div className="aspect-video bg-surface rounded-xl flex items-center justify-center">
        <p className="text-text-secondary">Tidak ada sumber video tersedia</p>
      </div>
    )
  }

  // External sources open on the provider's own site (new tab) — their
  // playback is not embeddable by design.
  if (activeSource.external) {
    return (
      <div>
        <a
          href={activeSource.src}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative aspect-video bg-surface rounded-xl overflow-hidden group border border-border hover:border-white/20 transition-colors"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-center px-4">
              <p className="font-semibold">{activeSource.label}</p>
              <p className="text-xs text-text-secondary mt-1">
                Klik untuk membuka pemutar di tab baru
              </p>
            </div>
          </div>
        </a>
        {sources.length > 1 && (
          <ServerSelector sources={sources} activeSource={activeSource} onSelect={setActiveSource} />
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-video bg-black rounded-t-xl overflow-hidden">
        <iframe
          key={activeSource.src}
          src={activeSource.src}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          sandbox={activeSource.noSandbox ? undefined : 'allow-scripts allow-same-origin allow-forms allow-presentation'}
          referrerPolicy="no-referrer"
        />
      </div>
      {sources.length > 1 && (
        <ServerSelector
          sources={sources}
          activeSource={activeSource}
          onSelect={setActiveSource}
        />
      )}
      <p className="text-xs text-text-secondary mt-2 px-1">
        Video tidak muncul atau error? Coba pilih server lain di atas.
      </p>
    </div>
  )
}
