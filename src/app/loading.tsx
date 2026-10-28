import { RowSkeleton, GridSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="pt-16">
      <div className="px-4 md:px-8 pt-10 pb-14 md:pt-20 md:pb-24 max-w-[1400px] mx-auto min-h-[440px] md:min-h-[560px] flex items-center">
        <div className="w-full max-w-2xl">
          <Skeleton className="h-6 w-28 rounded-full mb-6" />
          <Skeleton className="h-12 md:h-16 w-4/5 mb-4" />
          <Skeleton className="h-4 w-52 mb-8" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-36 rounded-full" />
            <Skeleton className="h-12 w-36 rounded-full" />
          </div>
        </div>
      </div>
      <RowSkeleton />
      <RowSkeleton />
      <div className="px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
        <GridSkeleton count={6} />
      </div>
    </div>
  )
}
