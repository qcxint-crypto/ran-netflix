import type { AnimeCard as AnimeCardType } from '@/types'
import AnimeCard from './AnimeCard'
import PosterGrid from '@/components/ui/PosterGrid'

export default function AnimeGrid({ animes }: { animes: AnimeCardType[] }) {
  return (
    <PosterGrid isEmpty={animes.length === 0} emptyMessage="Tidak ada anime ditemukan">
      {animes.map((anime) => (
        <AnimeCard key={anime.slug} anime={anime} />
      ))}
    </PosterGrid>
  )
}
