import { Skeleton } from "@/components/ui/Skeleton"

export default function Loading() {
  return (
    <div className="pt-16 max-w-3xl mx-auto px-4 py-6">
      <Skeleton className="h-10 w-full rounded-xl mb-4" />
      <div className="space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-full aspect-[2/3] rounded-none" />
        ))}
      </div>
    </div>
  )
}
