export default function Loading() {
  return (
    <div className="pt-16 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="animate-pulse bg-surface w-[180px] md:w-[240px] aspect-[3/4] rounded-2xl mx-auto md:mx-0" />
        <div className="flex-1 space-y-4">
          <div className="animate-pulse bg-surface h-8 w-64 rounded" />
          <div className="animate-pulse bg-surface h-4 w-full rounded" />
          <div className="animate-pulse bg-surface h-4 w-3/4 rounded" />
        </div>
      </div>
    </div>
  )
}
