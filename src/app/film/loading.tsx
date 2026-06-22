export default function FilmLoading() {
  return (
    <div className="pt-16 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <div className="h-8 w-48 bg-surface rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-surface rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
