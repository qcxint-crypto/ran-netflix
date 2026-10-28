'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion'

const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => null,
})

/**
 * Decorative 3D layer for the home hero. Renders nothing in its own layout box
 * (`absolute inset-0`) and is `pointer-events: none` end to end, so the nav, the
 * CTAs and the poster carousel underneath stay clickable while this loads or
 * runs. The CSS aurora under it is the reduced-motion fallback and the visual
 * for the window before the canvas initialises.
 */
export default function HeroScene({ posters }: { posters: string[] }) {
  const reducedMotion = usePrefersReducedMotion()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (reducedMotion) {
      setReady(false)
      return
    }
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setReady(true), { timeout: 1200 })
      : window.setTimeout(() => setReady(true), 300)

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number)
      window.clearTimeout(idle as number)
    }
  }, [reducedMotion])

  const urls = posters.filter(Boolean).slice(0, 7)
  if (urls.length === 0) return null

  return (
    // No z-index: the hero stacks these layers by DOM order, which keeps the
    // whole section inside one predictable stacking context.
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {/* Shown whenever the canvas is absent or still initialising. */}
      <div className="absolute inset-0 aurora-fallback opacity-80" />
      {ready && !reducedMotion && (
        <div className="absolute inset-0">
          <HeroCanvas posters={urls} />
        </div>
      )}
    </div>
  )
}
