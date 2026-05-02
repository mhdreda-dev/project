import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { stockService } from '@/modules/stock/stock.service'
import { apiSuccess, apiError } from '@/lib/utils'
import { getSessionStoreId } from '@/lib/store-context'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  const scope = { storeId: getSessionStoreId(session) }

  const days = Number(req.nextUrl.searchParams.get('days') ?? 30)
  const clampedDays = Math.min(Math.max(7, days), 365)
  const productId = req.nextUrl.searchParams.get('productId') ?? undefined

  try {
    const data = await stockService.getMovementChart(clampedDays, scope, productId)
    return apiSuccess(data)
  } catch {
    return apiError('Failed to fetch chart data', 500)
  }
}
