import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
import { updateProductSchema } from '@/lib/validations/product'
import { logActivity } from '@/lib/activity-logger'
import { apiSuccess, apiError, getClientIp } from '@/lib/utils'
import { ActivityAction } from '@prisma/client'

interface Params {
  params: { id: string }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)

  try {
    const product = await productsService.findById(params.id)
    if (!product) return apiError('Product not found', 404)
    return apiSuccess(product)
  } catch {
    return apiError('Failed to fetch product', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)

  try {
    const body = await req.json()
    const parsed = updateProductSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const old = await productsService.findById(params.id)
    const product = await productsService.update(params.id, parsed.data)

    await logActivity({
      userId: session.user.id,
      action: ActivityAction.UPDATE,
      entity: 'product',
      entityId: params.id,
      ipAddress: getClientIp(req),
      oldValues: old ? { name: old.name, isActive: old.isActive } : undefined,
      newValues: parsed.data as Record<string, unknown>,
    })

    return apiSuccess(product)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product'
    return apiError(message, 400)
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)

  try {
    const product = await productsService.delete(params.id)

    await logActivity({
      userId: session.user.id,
      action: ActivityAction.DELETE,
      entity: 'product',
      entityId: params.id,
      ipAddress: getClientIp(req),
      oldValues: { name: product.name, sku: product.sku },
      newValues: { deletedAt: product.deletedAt, isActive: product.isActive },
    })

    return apiSuccess({ archived: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Product not found') {
      return apiError('Product not found', 404)
    }
    return apiError('Unable to archive product. Please try again.', 400)
  }
}
