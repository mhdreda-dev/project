import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { usersService } from '@/modules/users/users.service'
import { logActivity } from '@/lib/activity-logger'
import { getSessionStoreId } from '@/lib/store-context'
import { apiSuccess, apiError, getClientIp } from '@/lib/utils'
import { ActivityAction } from '@prisma/client'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  isActive: z.boolean().optional(),
})

interface Params {
  params: { id: string }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  const scope = { storeId: getSessionStoreId(session) }
  if (session.user.role !== 'ADMIN' && session.user.id !== params.id) {
    return apiError('Forbidden', 403)
  }

  const user = await usersService.findById(params.id, scope)
  if (!user) return apiError('User not found', 404)
  return apiSuccess(user)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)
  const scope = { storeId: getSessionStoreId(session) }

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const user = await usersService.update(params.id, parsed.data, scope)

    await logActivity({
      storeId: scope.storeId,
      userId: session.user.id,
      action: ActivityAction.UPDATE,
      entity: 'user',
      entityId: params.id,
      ipAddress: getClientIp(req),
      newValues: parsed.data as Record<string, unknown>,
    })

    return apiSuccess(user)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user'
    return apiError(message, 400)
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)
  const scope = { storeId: getSessionStoreId(session) }

  try {
    await usersService.delete(params.id, session.user.id, scope)

    await logActivity({
      storeId: scope.storeId,
      userId: session.user.id,
      action: ActivityAction.DELETE,
      entity: 'user',
      entityId: params.id,
      ipAddress: getClientIp(req),
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user'
    return apiError(message, 400)
  }
}
