import type { MangaCard as MangaCardType } from '@/types'
import MangaCard from './MangaCard'
import PosterGrid from '@/components/ui/PosterGrid'

export default function MangaGrid({ mangas }: { mangas: MangaCardType[] }) {
  return (
    <PosterGrid isEmpty={mangas.length === 0} emptyMessage="Tidak ada manga ditemukan">
      {mangas.map((manga) => (
        <MangaCard key={manga.slug} manga={manga} />
      ))}
    </PosterGrid>
  )
}
