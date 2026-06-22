import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="pt-14 px-4 md:px-12 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 30 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
