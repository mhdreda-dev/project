import { PageHeaderSkeleton, TableRowSkeleton } from '@/components/ui/page-skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function LowStockLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="divide-y divide-slate-50 px-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={4} />
          ))}
        </div>
      </div>
    </div>
  )
}
