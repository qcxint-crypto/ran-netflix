import type { FilmCard as FilmCardType } from '@/types'
import FilmCard from '@/components/film/FilmCard'
import PosterRow, { PosterRowItem } from '@/components/ui/PosterRow'

export default function FilmRow({
  title,
  films,
  href,
  accent,
}: {
  title: string
  films: FilmCardType[]
  href?: string
  accent?: string
}) {
  if (films.length === 0) return null

  return (
    <PosterRow title={title} href={href} accent={accent}>
      {films.map((film) => (
        <PosterRowItem key={film.slug}>
          <FilmCard film={film} />
        </PosterRowItem>
      ))}
    </PosterRow>
  )
}
