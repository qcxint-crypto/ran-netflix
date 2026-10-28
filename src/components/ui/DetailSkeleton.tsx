import { Skeleton, GridSkeleton } from './Skeleton'

/** Shared loading shape for the anime / film / manga detail pages. */
export default function DetailSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="pt-16">
      <Skeleton className="w-full h-[34vh] md:h-[44vh] rounded-none" />
      <div className="px-4 md:px-8 -mt-32 md:-mt-40 relative max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <Skeleton className="w-[170px] md:w-[240px] aspect-[3/4] shrink-0 mx-auto md:mx-0 rounded-2xl" />
          <div className="flex-1 space-y-3 min-w-0">
            <Skeleton className="h-9 w-3/5" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-7 w-20 rounded-full" />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {Array.from({ length: rows * 2 }, (_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10">
          <GridSkeleton count={12} />
        </div>
      </div>
    </div>
  )
}
