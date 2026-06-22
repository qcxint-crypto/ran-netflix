import { GridSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="pt-14 px-4 md:px-12 py-8">
      <div className="animate-pulse bg-surface h-8 w-48 rounded mb-6" />
      <div className="animate-pulse bg-surface h-10 w-96 rounded mb-8" />
      <GridSkeleton />
    </div>
  )
}
