'use client'

import { useEffect, useRef, useState, type MutableRefObject } from 'react'

/**
 * Subscribes to a CSS media query. Starts as `false` so the server and the first
 * client render agree; callers that must not flash use `useMounted` instead.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True once the component is running in the browser, false during SSR. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

/**
 * Freezes the render loop while the tab is in the background. An animated
 * canvas that keeps drawing in a hidden tab is pure battery burn.
 */
export function useVisibilityFrameloop(): 'always' | 'never' {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return visible ? 'always' : 'never'
}

/**
 * Pointer position normalised to [-1, 1] on both axes, tracked on `window`.
 *
 * The hero canvas is `pointer-events: none` so it can never swallow a click on
 * the nav or a CTA; that is why the listener lives on the window rather than on
 * the R3F event system.
 */
export function usePointer(): MutableRefObject<{ x: number; y: number }> {
  const ref = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      ref.current.x = (event.clientX / window.innerWidth) * 2 - 1
      ref.current.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [ref])

  return ref
}
