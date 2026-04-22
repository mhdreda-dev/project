import { PageHeaderSkeleton, FilterRowSkeleton, ProductGridSkeleton } from '@/components/ui/page-skeletons'

export default function ProductsLoading() {
  return (
    <div>
      <PageHeaderSkeleton withAction />
      <FilterRowSkeleton />
      <ProductGridSkeleton count={8} />
    </div>
  )
}
