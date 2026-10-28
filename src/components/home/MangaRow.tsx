import type { MangaCard as MangaCardType } from '@/types'
import MangaCard from '@/components/manga/MangaCard'
import PosterRow, { PosterRowItem } from '@/components/ui/PosterRow'

export default function MangaRow({
  title,
  mangas,
  href,
  accent,
}: {
  title: string
  mangas: MangaCardType[]
  href?: string
  accent?: string
}) {
  if (mangas.length === 0) return null

  return (
    <PosterRow title={title} href={href} accent={accent}>
      {mangas.map((manga) => (
        <PosterRowItem key={manga.slug}>
          <MangaCard manga={manga} />
        </PosterRowItem>
      ))}
    </PosterRow>
  )
}
