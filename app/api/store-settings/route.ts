import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getSessionStoreId } from '@/lib/store-context'
import { apiError, apiSuccess, getClientIp } from '@/lib/utils'
import { updateStoreSettingsSchema } from '@/lib/validations/store'
import { storesService } from '@/modules/stores/stores.service'
import { logActivity } from '@/lib/activity-logger'
import { ActivityAction } from '@prisma/client'

function canEdit(role: string | undefined) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export async function GET() {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (!canEdit(session.user.role)) return apiError('Forbidden', 403)

  const store = await storesService.findSettings(getSessionStoreId(session))
  if (!store) return apiError('Store not found', 404)
  return apiSuccess(store)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (!canEdit(session.user.role)) return apiError('Forbidden', 403)

  try {
    const body = await req.json()
    const parsed = updateStoreSettingsSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const storeId = getSessionStoreId(session)
    const old = await storesService.findSettings(storeId)
    if (!old) return apiError('Store not found', 404)

    const store = await storesService.updateSettings(storeId, parsed.data)

    await logActivity({
      storeId,
      userId: session.user.id,
      action: ActivityAction.UPDATE,
      entity: 'store_settings',
      entityId: storeId,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
      oldValues: {
        name: old.name,
        phone: old.phone,
        whatsapp: old.whatsapp,
        logoUrl: old.logoUrl,
      },
      newValues: parsed.data as Record<string, unknown>,
    })

    return apiSuccess(store)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update store settings'
    return apiError(message, 400)
  }
}
