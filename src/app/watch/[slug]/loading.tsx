import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="pt-16 px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-48 mb-3" />
          <Skeleton className="h-7 w-2/3 mb-4" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <div className="flex gap-3 mt-4">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
        </div>
        <div className="w-full lg:w-[340px] shrink-0">
          <div className="glass rounded-2xl overflow-hidden">
            <Skeleton className="aspect-[16/9] rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="p-4 space-y-2">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
