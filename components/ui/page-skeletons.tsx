import { Skeleton } from './skeleton'

/**
 * Shared page-level skeleton compositions. Grouped here so the Next.js
 * `loading.tsx` files stay tiny and the visual language stays consistent
 * across the app.
 */

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  )
}

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-8" />
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-50">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="space-y-1.5 items-end flex flex-col">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PageHeaderSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      {withAction && <Skeleton className="h-10 w-32 rounded-xl" />}
    </div>
  )
}

export function FilterRowSkeleton() {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Skeleton className="h-10 w-[260px] max-w-full rounded-xl" />
      <Skeleton className="h-10 w-28 rounded-xl" />
      <Skeleton className="h-10 w-28 rounded-xl" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  // Pre-computed widths so Tailwind JIT can see every class we render.
  const widths = ['flex-1', 'w-20', 'w-16', 'w-24', 'w-12', 'w-20']
  return (
    <div className="py-3 flex items-center gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${widths[i % widths.length]}`} />
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <Skeleton className="h-5 w-44 mb-2" />
      <Skeleton className="h-3 w-56 mb-5" />
      <Skeleton style={{ height }} className="w-full" />
    </div>
  )
}
