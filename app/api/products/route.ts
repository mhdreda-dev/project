import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
import { createProductSchema, productQuerySchema } from '@/lib/validations/product'
import { logActivity } from '@/lib/activity-logger'
import { getSessionStoreId } from '@/lib/store-context'
import { apiSuccess, apiError, getClientIp } from '@/lib/utils'
import { ActivityAction } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  const scope = { storeId: getSessionStoreId(session) }

  const { searchParams } = req.nextUrl
  const queryParsed = productQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries()),
  )

  if (!queryParsed.success) return apiError(queryParsed.error.errors[0].message, 422)

  try {
    const result = await productsService.list(queryParsed.data, scope, {
      includeFinancials: session.user.role === 'ADMIN',
    })
    return apiSuccess(result)
  } catch (error) {
    return apiError('Failed to fetch products', 500)
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  const scope = { storeId: getSessionStoreId(session) }

  try {
    const body = await req.json()
    if (session.user.role === 'EMPLOYEE' && body.costPrice != null) {
      return apiError('Forbidden', 403)
    }

    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const input = session.user.role === 'ADMIN'
      ? parsed.data
      : { ...parsed.data, costPrice: null }
    const product = await productsService.create(input, scope, session.user.id)

    await logActivity({
      storeId: scope.storeId,
      userId: session.user.id,
      action: ActivityAction.CREATE,
      entity: 'product',
      entityId: product.id,
      ipAddress: getClientIp(req),
      newValues: { name: product.name, sku: product.sku },
    })

    return apiSuccess(product, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product'
    return apiError(message, 400)
  }
}
