import HeroBanner from '@/components/home/HeroBanner'
import AnimeRow from '@/components/home/AnimeRow'
import MangaRow from '@/components/home/MangaRow'
import FilmRow from '@/components/home/FilmRow'
import { getHome } from '@/lib/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export default async function HomePage() {
  const data = await getHome()

  if (data.ongoing.length === 0 && data.completed.length === 0) {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Data sedang dimuat.</p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-accent hover:bg-accent-hover text-black rounded-full text-sm font-semibold transition-colors"
          >
            Refresh
          </a>
        </div>
      </div>
    )
  }

  const heroAnime = data.ongoing[0] || data.completed[0]

  // Posters for the 3D wall. Anime covers come from AniList, film covers from
  // TMDB — both send permissive CORS headers, so they can be used as WebGL
  // textures. Manga covers are served through the same-origin image proxy,
  // which does not, so they are left out of the wall.
  const posters = [
    ...data.ongoing.map((a) => a.image),
    ...data.completed.map((a) => a.image),
    ...(data.films ?? []).map((f) => f.image),
  ].filter(Boolean)

  return (
    <div className="pt-16">
      {heroAnime && <HeroBanner anime={heroAnime} posters={posters} />}

      <div className="relative -mt-8 md:-mt-14">
        <AnimeRow title="Ongoing Now" animes={data.ongoing} href="/ongoing" accent="airing" />
        <AnimeRow title="Completed" animes={data.completed} href="/completed" />
        {data.movies && data.movies.length > 0 && (
          <AnimeRow title="Anime Movies" animes={data.movies} href="/movies" />
        )}
        {data.malTop && data.malTop.length > 0 && (
          <AnimeRow title="Top MyAnimeList" animes={data.malTop} />
        )}
        {data.films && data.films.length > 0 && (
          <FilmRow title="Film & Series Terbaru" films={data.films} href="/film" />
        )}
        {data.manga && data.manga.length > 0 && (
          <MangaRow title="Popular Manga" mangas={data.manga} href="/manga" />
        )}
      </div>
    </div>
  )
}
