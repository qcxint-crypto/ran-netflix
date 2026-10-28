import type { FilmCard as FilmCardType } from '@/types'
import FilmCard from './FilmCard'
import PosterGrid from '@/components/ui/PosterGrid'

export default function FilmGrid({ films }: { films: FilmCardType[] }) {
  return (
    <PosterGrid isEmpty={films.length === 0} emptyMessage="Tidak ada film ditemukan">
      {films.map((film) => (
        <FilmCard key={film.slug} film={film} />
      ))}
    </PosterGrid>
  )
}
