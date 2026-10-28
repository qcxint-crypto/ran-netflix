export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-surface rounded-xl ${className}`}
      aria-hidden
    >
      {/* Sweeping highlight reads as "loading" where a flat pulse reads as
          "empty card". */}
      <div className="absolute inset-0 shimmer animate-shimmer" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="block">
      <Skeleton className="aspect-[3/4]" />
      <Skeleton className="h-3 w-4/5 mt-2.5 rounded-md" />
    </div>
  )
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function RowSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div className="py-7 md:py-9">
      <div className="px-4 md:px-8 max-w-[1400px] mx-auto mb-5">
        <Skeleton className="h-6 w-40 rounded-md" />
      </div>
      <div className="overflow-hidden px-4 md:px-8">
        <div className="flex gap-4 max-w-[1400px] mx-auto">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="w-[142px] md:w-[180px] shrink-0">
              <Skeleton className="aspect-[3/4]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
