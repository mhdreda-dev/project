import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
import { apiSuccess, apiError } from '@/lib/utils'
import { getSessionStoreId } from '@/lib/store-context'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)
  const scope = { storeId: getSessionStoreId(session) }

  try {
    const stats = await productsService.getDashboardStats(scope)
    return apiSuccess(stats)
  } catch {
    return apiError('Failed to fetch stats', 500)
  }
}
