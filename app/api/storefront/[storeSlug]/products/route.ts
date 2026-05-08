import { type NextRequest } from 'next/server'
import {
  getPublicStore,
  getPublicProducts,
  getPublicCategories,
} from '@/lib/storefront/storefront.service'
import { apiSuccess, apiError } from '@/lib/utils'

export async function GET(
  req: NextRequest,
  { params }: { params: { storeSlug: string } },
) {
  const { storeSlug } = params
  if (!/^[a-z0-9-]+$/.test(storeSlug)) return apiError('Invalid store slug', 422)

  const store = await getPublicStore(storeSlug)
  if (!store) return apiError('Store not found', 404)

  const { searchParams } = req.nextUrl
  const category = searchParams.get('category') ?? undefined
  const search = searchParams.get('search') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '24', 10)))

  const [result, categories] = await Promise.all([
    getPublicProducts(store.id, { category, search, page, limit }),
    getPublicCategories(store.id),
  ])

  return apiSuccess({ ...result, categories })
}
