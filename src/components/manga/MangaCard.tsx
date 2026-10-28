import type { MangaCard as MangaCardType } from '@/types'
import PosterCard from '@/components/ui/PosterCard'

export default function MangaCard({
  manga,
  priority = false,
}: {
  manga: MangaCardType
  priority?: boolean
}) {
  return (
    <PosterCard
      href={`/manga/${manga.slug}`}
      image={manga.image}
      title={manga.title}
      kind="manga"
      topLeft={manga.type || 'Manga'}
      bottom={manga.chapter}
      priority={priority}
    />
  )
}
