import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
import { brandsService } from '@/modules/brands/brands.service'
import { ProductsClient } from './products-client'
import { getServerI18n } from '@/lib/i18n/server'
import { getSessionStoreId } from '@/lib/store-context'

export const dynamic = 'force-dynamic'

const EMPTY_META = { total: 0, page: 1, limit: 12, totalPages: 0, hasNext: false, hasPrev: false }

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; category?: string }
}) {
  const session = await auth()
  const scope = { storeId: getSessionStoreId(session) }
  const { t } = getServerI18n()
  const page = Number(searchParams.page ?? 1)
  const search = searchParams.search
  const category = searchParams.category

  let products: any[] = []
  let meta: any = EMPTY_META
  let allBrands: { id: string; name: string }[] = []
  let loadError: string | null = null

  try {
    const result = await productsService.list(
      { page, limit: 12, search, category },
      scope,
      { includeFinancials: session?.user?.role === 'ADMIN' },
    )
    products = result.products ?? []
    meta = result.meta ?? EMPTY_META
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load products'
    console.error('[ProductsPage] products load error:', e)
  }

  try {
    const list = await brandsService.listAll(scope)
    allBrands = (list as { id: string; name: string }[]).map((b) => ({ id: b.id, name: b.name }))
  } catch (e) {
    console.error('[ProductsPage] brands load error:', e)
  }

  if (loadError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">{t('products.unavailableTitle')}</h1>
        <p className="text-sm text-slate-600">
          {t('products.unavailableDescription')}
        </p>
        <pre className="mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto">
          {loadError}
        </pre>
      </div>
    )
  }

  return (
    <ProductsClient
      initialProducts={products as any}
      meta={meta}
      brands={allBrands}
      isAdmin={session?.user?.role === 'ADMIN'}
    />
  )
}
