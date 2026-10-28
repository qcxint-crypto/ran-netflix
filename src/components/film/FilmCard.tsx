import type { FilmCard as FilmCardType } from '@/types'
import PosterCard from '@/components/ui/PosterCard'

export default function FilmCard({
  film,
  priority = false,
}: {
  film: FilmCardType
  priority?: boolean
}) {
  return (
    <PosterCard
      href={`/film/${film.slug}`}
      image={film.image}
      title={film.title}
      kind="film"
      topLeft={film.episode ? 'Series' : 'Film'}
      topRight={film.quality}
      bottom={film.year}
      rating={film.rating}
      priority={priority}
    />
  )
}
