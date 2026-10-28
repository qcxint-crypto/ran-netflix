import type { AnimeCard as AnimeCardType } from '@/types'
import AnimeCard from '@/components/anime/AnimeCard'
import PosterRow, { PosterRowItem } from '@/components/ui/PosterRow'

export default function AnimeRow({
  title,
  animes,
  href,
  accent,
}: {
  title: string
  animes: AnimeCardType[]
  href?: string
  accent?: string
}) {
  if (animes.length === 0) return null

  return (
    <PosterRow title={title} href={href} accent={accent}>
      {animes.map((anime, i) => (
        <PosterRowItem key={anime.slug}>
          <AnimeCard anime={anime} priority={i < 3} />
        </PosterRowItem>
      ))}
    </PosterRow>
  )
}
