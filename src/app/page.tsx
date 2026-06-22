import HeroBanner from '@/components/home/HeroBanner'
import AnimeRow from '@/components/home/AnimeRow'
import { getHome } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export default async function HomePage() {
  let data
  try {
    data = await getHome()
  } catch {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Gagal memuat data. Silakan refresh halaman.</p>
      </div>
    )
  }

  const heroAnime = data.ongoing[0] || data.completed[0]

  return (
    <div className="pt-16">
      {heroAnime && <HeroBanner anime={heroAnime} />}
      <AnimeRow title="Ongoing Now" animes={data.ongoing} href="/ongoing" />
      <AnimeRow title="Completed" animes={data.completed} href="/completed" />
    </div>
  )
}
