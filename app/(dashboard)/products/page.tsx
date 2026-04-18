import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
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

  const [{ products, meta }, categories] = await Promise.all([
    productsService.list({ page, limit: 12, search, category }),
    productsService.getCategories(),
  ])

  return (
    <ProductsClient
      products={products}
      meta={meta}
      categories={categories}
      isAdmin={session?.user?.role === 'ADMIN'}
      initialSearch={search}
      initialCategory={category}
    />
  )
}
