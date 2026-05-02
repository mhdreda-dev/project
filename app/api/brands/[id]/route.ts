import { auth } from '@/lib/auth'
import { brandsService } from '@/modules/brands/brands.service'
import { updateBrandSchema } from '@/lib/validations/brand'
import { apiSuccess, apiError } from '@/lib/utils'
import { NextRequest } from 'next/server'
import { getSessionStoreId } from '@/lib/store-context'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)
    const scope = { storeId: getSessionStoreId(session) }
    const brand = await brandsService.findById(params.id, scope)
    if (!brand) return apiError('Brand not found', 404)
    return apiSuccess(brand)
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Failed to fetch brand')
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)
    const scope = { storeId: getSessionStoreId(session) }
    const body = await req.json()
    const input = updateBrandSchema.parse(body)
    const brand = await brandsService.update(params.id, input, scope)
    return apiSuccess(brand)
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Failed to update brand')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)
    await brandsService.delete(params.id, { storeId: getSessionStoreId(session) })
    return apiSuccess({ deleted: true })
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Failed to delete brand')
  }
}
