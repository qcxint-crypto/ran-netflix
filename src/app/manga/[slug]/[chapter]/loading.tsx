export default function Loading() {
  return (
    <div className="pt-16 max-w-3xl mx-auto px-4 py-8">
      <div className="animate-pulse bg-surface h-6 w-48 rounded mb-6 mx-auto" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-surface w-full aspect-[2/3] rounded" />
        ))}
      </div>
    </div>
  )
}
