import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
import { createProductSchema, productQuerySchema } from '@/lib/validations/product'
import { logActivity } from '@/lib/activity-logger'
import { apiSuccess, apiError, getClientIp } from '@/lib/utils'
import { ActivityAction } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = req.nextUrl
  const queryParsed = productQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries()),
  )

  if (!queryParsed.success) return apiError(queryParsed.error.errors[0].message, 422)

  try {
    const result = await productsService.list(queryParsed.data)
    return apiSuccess(result)
  } catch (error) {
    return apiError('Failed to fetch products', 500)
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)

  try {
    const body = await req.json()
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const product = await productsService.create(parsed.data, session.user.id)

    await logActivity({
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
