import type { MangaCard as MangaCardType } from '@/types'
import MangaCard from './MangaCard'

export default function MangaGrid({ mangas }: { mangas: MangaCardType[] }) {
  if (mangas.length === 0) {
    return (
      <div className="text-center py-20 text-text-secondary">
        Tidak ada manga ditemukan
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
      {mangas.map((manga) => (
        <MangaCard key={manga.slug} manga={manga} />
      ))}
    </div>
  )
}
