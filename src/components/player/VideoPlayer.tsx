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

  return (
    <div>
      <div className="relative aspect-video bg-black rounded-t-xl overflow-hidden">
        <iframe
          key={activeSource.src}
          src={activeSource.src}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
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
    </div>
  )
}
