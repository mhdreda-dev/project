import { Skeleton } from '@/components/ui/skeleton'
import { StatRowSkeleton, ChartSkeleton } from '@/components/ui/page-skeletons'

export default function ProductDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid grid-cols-3 gap-3 pt-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
      <StatRowSkeleton count={3} />
      <ChartSkeleton height={220} />
    </div>
  )
}
