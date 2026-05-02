import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { stockService } from '@/modules/stock/stock.service'
import { apiSuccess, apiError } from '@/lib/utils'
import { getSessionStoreId } from '@/lib/store-context'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  const scope = { storeId: getSessionStoreId(session) }

  try {
    const items = await stockService.getLowStock(scope)
    return apiSuccess(items)
  } catch {
    return apiError('Failed to fetch low stock', 500)
  }
}
