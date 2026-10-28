import type { AnimeCard as AnimeCardType } from '@/types'
import PosterCard from '@/components/ui/PosterCard'

export default function AnimeCard({
  anime,
  priority = false,
}: {
  anime: AnimeCardType
  priority?: boolean
}) {
  // The scraper prefixes scores with a star already; the card draws its own.
  const rating = anime.rating?.replace(/[^0-9.]/g, '') || undefined

  return (
    <PosterCard
      href={`/anime/${anime.slug}`}
      image={anime.image}
      title={anime.title}
      kind="anime"
      topLeft="Anime"
      bottom={anime.episode}
      rating={rating}
      priority={priority}
    />
  )
}
