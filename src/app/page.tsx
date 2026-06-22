import HeroBanner from '@/components/home/HeroBanner'
import AnimeRow from '@/components/home/AnimeRow'
import MangaRow from '@/components/home/MangaRow'
import { getHome } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export default async function HomePage() {
  const data = await getHome()

  if (data.ongoing.length === 0 && data.completed.length === 0) {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Data sedang dimuat. Silakan refresh halaman.</p>
      </div>
    )
  }

  const heroAnime = data.ongoing[0] || data.completed[0]

  return (
    <div className="pt-16">
      {heroAnime && <HeroBanner anime={heroAnime} />}
      <AnimeRow title="Ongoing Now" animes={data.ongoing} href="/ongoing" />
      <AnimeRow title="Completed" animes={data.completed} href="/completed" />
      {data.movies && data.movies.length > 0 && (
        <AnimeRow title="Anime Movies" animes={data.movies} href="/movies" />
      )}
      {data.manga && data.manga.length > 0 && (
        <MangaRow title="Popular Manga" mangas={data.manga} href="/manga" />
      )}
    </div>
  )
}
