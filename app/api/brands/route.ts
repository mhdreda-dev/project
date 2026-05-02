import { auth } from '@/lib/auth'
import { brandsService } from '@/modules/brands/brands.service'
import { createBrandSchema, brandQuerySchema } from '@/lib/validations/brand'
import { apiSuccess, apiError } from '@/lib/utils'
import { NextRequest } from 'next/server'
import { getSessionStoreId } from '@/lib/store-context'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)
    const scope = { storeId: getSessionStoreId(session) }

    const { searchParams } = req.nextUrl
    const query = brandQuerySchema.parse(Object.fromEntries(searchParams))
    const result = await brandsService.list(query, scope)
    return apiSuccess(result)
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Failed to fetch brands')
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)
    const scope = { storeId: getSessionStoreId(session) }

    const body = await req.json()
    const input = createBrandSchema.parse(body)
    const brand = await brandsService.create(input, scope.storeId)
    return apiSuccess(brand, 201)
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Failed to create brand')
  }
}
