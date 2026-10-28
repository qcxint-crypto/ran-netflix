'use client'

import { useState } from 'react'
import type { StreamingSource } from '@/types'
import ServerSelector from './ServerSelector'

export default function VideoPlayer({
  sources,
  poster,
  note,
}: {
  sources: StreamingSource[]
  poster?: string
  note?: string
}) {
  const [activeSource, setActiveSource] = useState(sources[0] || null)

  if (!activeSource) {
    return (
      <div className="aspect-video glass rounded-2xl flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-14 h-14 rounded-full glass flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-text-muted" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-text-primary font-semibold">
          {note || 'Tidak ada sumber video tersedia'}
        </p>
        <p className="text-xs text-text-secondary max-w-sm">
          Semua provider yang dicek tidak menyediakan episode ini. Coba lagi nanti
          atau buka episode lain.
        </p>
      </div>
    )
  }

  // External sources open on the provider's own site (new tab) — their playback
  // is not embeddable by design.
  if (activeSource.external) {
    return (
      <div>
        <a
          href={activeSource.src}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative aspect-video glass rounded-2xl overflow-hidden group"
        >
          {poster && (
            <img
              src={poster}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm scale-105"
            />
          )}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-accent/90 group-hover:bg-accent flex items-center justify-center transition-all duration-300 group-hover:scale-110">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-black ml-0.5" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-center px-4">
              <p className="font-semibold text-text-primary">{activeSource.label}</p>
              <p className="text-xs text-text-secondary mt-1">
                Klik untuk membuka pemutar di tab baru
              </p>
            </div>
          </div>
        </a>
        <ServerSelector sources={sources} activeSource={activeSource} onSelect={setActiveSource} />
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-video bg-black rounded-t-2xl overflow-hidden border border-border border-b-0">
        <iframe
          key={activeSource.src}
          src={activeSource.src}
          title={activeSource.label}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          sandbox={
            activeSource.noSandbox
              ? undefined
              : 'allow-scripts allow-same-origin allow-forms allow-presentation'
          }
          referrerPolicy="no-referrer"
        />
      </div>

      {sources.length > 1 && (
        <ServerSelector sources={sources} activeSource={activeSource} onSelect={setActiveSource} />
      )}

      {/* Escape hatch: some embeds refuse to play in an iframe regardless of
          sandbox. Always give the user a way out of a black box. */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="text-text-secondary">
          Video tidak muncul atau error? Coba pilih server lain di atas.
        </p>
        <a
          href={activeSource.src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 glass rounded-full text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
        >
          Buka di tab baru
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  )
}
