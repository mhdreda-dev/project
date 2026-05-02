import { auth } from '@/lib/auth'
import { stockService } from '@/modules/stock/stock.service'
import { db } from '@/lib/db'
import { StockClient } from './stock-client'
import { getSessionStoreId } from '@/lib/store-context'

export default async function StockPage({
  searchParams,
}: {
  searchParams: { page?: string; type?: string; productId?: string }
}) {
  const session = await auth()
  const scope = { storeId: getSessionStoreId(session) }
  const page = Number(searchParams.page ?? 1)

  const [{ movements, meta }, products] = await Promise.all([
    stockService.list({
      page,
      limit: 20,
      type: searchParams.type as 'IN' | 'OUT' | 'ADJUSTMENT' | undefined,
      productId: searchParams.productId,
    }, scope),
    db.product.findMany({
      where: { storeId: scope.storeId, isActive: true, deletedAt: null },
      select: { id: true, name: true, sku: true, sizes: { select: { id: true, size: true, quantity: true, minQuantity: true } } },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <StockClient
      movements={movements}
      meta={meta}
      products={products}
      isAdmin={session?.user?.role === 'ADMIN'}
    />
  )
}
