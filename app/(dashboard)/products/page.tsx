import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
import { brandsService } from '@/modules/brands/brands.service'
import { ProductsClient } from './products-client'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; category?: string }
}) {
  const session = await auth()
  const page = Number(searchParams.page ?? 1)
  const search = searchParams.search
  const category = searchParams.category

  const [{ products, meta }, allBrands] = await Promise.all([
    productsService.list({ page, limit: 12, search, category }),
    brandsService.listAll(),
  ])

  return (
    <ProductsClient
      initialProducts={products as any}
      meta={meta}
      brands={(allBrands as { id: string; name: string }[]).map((b) => ({ id: b.id, name: b.name }))}
      isAdmin={session?.user?.role === 'ADMIN'}
    />
  )
}
