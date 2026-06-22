export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-surface rounded ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="block">
      <Skeleton className="aspect-[3/4] rounded-xl" />
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
