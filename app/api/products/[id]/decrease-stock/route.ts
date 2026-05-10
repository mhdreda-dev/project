import { NextRequest } from 'next/server'
import { ActivityAction } from '@prisma/client'
import { auth } from '@/lib/auth'
import { logActivity } from '@/lib/activity-logger'
import { getSessionStoreId } from '@/lib/store-context'
import { apiError, apiSuccess, getClientIp } from '@/lib/utils'
import { decreaseStockSchema } from '@/lib/validations/stock'
import { stockService } from '@/modules/stock/stock.service'

interface Params {
  params: { id: string }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN' && session.user.role !== 'EMPLOYEE') {
    return apiError('Forbidden', 403)
  }

  const scope = { storeId: getSessionStoreId(session) }

  try {
    const body = await req.json()
    const parsed = decreaseStockSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const movement = await stockService.decreaseStockForSale(
      params.id,
      parsed.data,
      session.user.id,
      scope,
    )

    await logActivity({
      storeId: scope.storeId,
      userId: session.user.id,
      action: ActivityAction.STOCK_OUT,
      entity: 'stock_movement',
      entityId: movement.id,
      ipAddress: getClientIp(req),
      newValues: {
        productId: params.id,
        productSizeId: parsed.data.productSizeId,
        quantity: parsed.data.quantity,
        reason: 'SALE',
        note: parsed.data.note,
      },
    })

    return apiSuccess(movement, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to decrease stock'
    return apiError(message, message === 'Product size not found' ? 404 : 400)
  }
}
