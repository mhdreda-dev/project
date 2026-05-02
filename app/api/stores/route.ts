import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { storesService } from '@/modules/stores/stores.service'
import { createStoreSchema } from '@/lib/validations/store'
import { logActivity } from '@/lib/activity-logger'
import { apiSuccess, apiError, getClientIp } from '@/lib/utils'
import { ActivityAction } from '@prisma/client'

function isSuperAdmin(role: string | undefined) {
  return role === 'SUPER_ADMIN'
}

export async function GET() {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (!isSuperAdmin(session.user.role)) return apiError('Forbidden', 403)

  try {
    const stores = await storesService.list()
    return apiSuccess(stores)
  } catch {
    return apiError('Failed to fetch stores', 500)
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (!isSuperAdmin(session.user.role)) return apiError('Forbidden', 403)

  try {
    const body = await req.json()
    const parsed = createStoreSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const result = await storesService.create(parsed.data)

    await logActivity({
      storeId: result.store.id,
      userId: session.user.id,
      action: ActivityAction.CREATE,
      entity: 'store',
      entityId: result.store.id,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
      newValues: {
        name: result.store.name,
        slug: result.store.slug,
        adminEmail: result.admin.email,
      },
    })

    return apiSuccess(result, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create store'
    return apiError(message, 400)
  }
}
