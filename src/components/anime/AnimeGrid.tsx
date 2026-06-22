import type { AnimeCard as AnimeCardType } from '@/types'
import AnimeCard from './AnimeCard'

export default function AnimeGrid({ animes }: { animes: AnimeCardType[] }) {
  if (animes.length === 0) {
    return (
      <div className="text-center py-20 text-text-secondary">
        Tidak ada anime ditemukan
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
      {animes.map((anime) => (
        <AnimeCard key={anime.slug} anime={anime} />
      ))}
    </div>
  )
}
