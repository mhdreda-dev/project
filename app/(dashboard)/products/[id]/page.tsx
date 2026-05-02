import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
import { ProductDetailClient } from './product-detail-client'
import { getSessionStoreId } from '@/lib/store-context'

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const scope = { storeId: getSessionStoreId(session) }
  const product = await productsService.findById(params.id, scope, {
    includeFinancials: session?.user?.role === 'ADMIN',
  })
  if (!product) notFound()

  return (
    <ProductDetailClient
      product={product as any}
      isAdmin={session?.user?.role === 'ADMIN'}
    />
  )
}
