import { type NextRequest } from 'next/server'
import { getPublicStore } from '@/lib/storefront/storefront.service'
import { apiSuccess, apiError } from '@/lib/utils'

export async function GET(
  _req: NextRequest,
  { params }: { params: { storeSlug: string } },
) {
  const { storeSlug } = params
  if (!/^[a-z0-9-]+$/.test(storeSlug)) return apiError('Invalid store slug', 422)

  const store = await getPublicStore(storeSlug)
  if (!store) return apiError('Store not found', 404)

  return apiSuccess({ store })
}
