import { GridSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="pt-14 px-4 md:px-12 py-8">
      <div className="animate-pulse bg-surface rounded-xl h-[50vh] mb-8" />
      <GridSkeleton />
    </div>
  )
}
