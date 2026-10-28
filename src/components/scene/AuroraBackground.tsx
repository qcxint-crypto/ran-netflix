'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion'

const AuroraCanvas = dynamic(() => import('./AuroraCanvas'), {
  ssr: false,
  loading: () => null,
})

/**
 * Fixed, full-viewport aurora behind every page. One canvas for the whole app —
 * per-section canvases would each pay their own WebGL context and context
 * switches are what actually costs here.
 *
 * Fallback ladder:
 *   reduced motion        -> static CSS gradient, no canvas at all
 *   before idle / unmount -> static CSS gradient, then swap in
 * Animated gradient, nothing else on the page depends on it, so it mounts only
 * once the browser is idle.
 */
export default function AuroraBackground() {
  const reducedMotion = usePrefersReducedMotion()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (reducedMotion) {
      setReady(false)
      return
    }

    // requestIdleCallback is absent in Safari; a timeout is a fine substitute
    // since this is purely cosmetic.
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setReady(true), { timeout: 2500 })
      : window.setTimeout(() => setReady(true), 900)

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number)
      window.clearTimeout(idle as number)
    }
  }, [reducedMotion])

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-[#07070c]">
      {/* Always painted: this is the base layer the canvas composites over and
          the entirety of what reduced-motion users see. */}
      <div
        className={`absolute inset-0 ${
          reducedMotion ? '' : 'animate-aurora'
        } aurora-fallback`}
      />
      {ready && !reducedMotion && <AuroraCanvas intensity={1} fps={30} />}
    </div>
  )
}
