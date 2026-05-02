import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { stockService } from '@/modules/stock/stock.service'
import { stockMovementSchema, stockQuerySchema } from '@/lib/validations/stock'
import { logActivity } from '@/lib/activity-logger'
import { getSessionStoreId } from '@/lib/store-context'
import { apiSuccess, apiError, getClientIp } from '@/lib/utils'
import { ActivityAction } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  const scope = { storeId: getSessionStoreId(session) }

  const { searchParams } = req.nextUrl
  const parsed = stockQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  try {
    const result = await stockService.list(parsed.data, scope)
    return apiSuccess(result)
  } catch {
    return apiError('Failed to fetch stock movements', 500)
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  const scope = { storeId: getSessionStoreId(session) }

  try {
    const body = await req.json()
    const parsed = stockMovementSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const movement = await stockService.recordMovement(parsed.data, session.user.id, scope)

    const actionMap = {
      IN: ActivityAction.STOCK_IN,
      OUT: ActivityAction.STOCK_OUT,
      ADJUSTMENT: ActivityAction.STOCK_ADJUST,
    }

    await logActivity({
      storeId: scope.storeId,
      userId: session.user.id,
      action: actionMap[parsed.data.type],
      entity: 'stock_movement',
      entityId: movement.id,
      ipAddress: getClientIp(req),
      newValues: {
        type: parsed.data.type,
        quantity: parsed.data.quantity,
        productSizeId: parsed.data.productSizeId,
      },
    })

    return apiSuccess(movement, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record movement'
    return apiError(message, 400)
  }
}
