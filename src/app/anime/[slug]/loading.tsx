import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="pt-14">
      <Skeleton className="h-64 md:h-80 w-full" />
      <div className="px-4 md:px-12 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="w-[200px] h-[280px] rounded-xl mx-auto md:mx-0 shrink-0" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
