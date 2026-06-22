import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="pt-14 px-2 md:px-12 py-4 md:py-8 max-w-5xl mx-auto">
      <Skeleton className="h-6 w-64 mb-4 mx-2" />
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="flex gap-3 mt-4 mx-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  )
}
