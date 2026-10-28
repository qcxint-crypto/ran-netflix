import { Skeleton, GridSkeleton } from './Skeleton'

/** Shared loading shape for the paginated list pages. */
export default function ListSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="pt-16 px-4 md:px-8 py-10 max-w-[1400px] mx-auto">
      <Skeleton className="h-9 w-56 mb-3" />
      <Skeleton className="h-4 w-40 mb-9" />
      <GridSkeleton count={count} />
    </div>
  )
}
