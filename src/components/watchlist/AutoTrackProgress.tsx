'use client'

import { useEffect } from 'react'
import { useWatchlist } from './WatchlistProvider'

interface Props {
  slug: string
  episode: number
  title: string
  image: string
  totalEpisodes: number
}

/**
 * Records that the visitor opened this episode. Renders nothing — it exists so
 * the server-rendered watch page can update local watch progress.
 *
 * Progress only ever moves forward (`max(progress, episode)`), so revisiting an
 * earlier episode never rewinds the counter.
 */
export default function AutoTrackProgress({ slug, episode, title, image, totalEpisodes }: Props) {
  const { bumpProgress, ready } = useWatchlist()

  useEffect(() => {
    if (!ready) return
    bumpProgress(slug, episode, { title, image, totalEpisodes })
  }, [ready, slug, episode, title, image, totalEpisodes, bumpProgress])

  return null
}
