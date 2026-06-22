import type { FilmCard as FilmCardType } from '@/types'
import FilmCard from './FilmCard'

export default function FilmGrid({ films }: { films: FilmCardType[] }) {
  if (films.length === 0) {
    return (
      <div className="text-center py-20 text-text-secondary">
        Tidak ada film ditemukan
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
      {films.map((film) => (
        <FilmCard key={film.slug} film={film} />
      ))}
    </div>
  )
}
