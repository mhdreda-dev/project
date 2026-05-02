import { NextRequest } from 'next/server'
import { registerSchema } from '@/lib/validations/auth'
import { auth } from '@/lib/auth'
import { getSessionStoreId } from '@/lib/store-context'
import { authService } from '@/modules/auth/auth.service'
import { logActivity } from '@/lib/activity-logger'
import { apiSuccess, apiError, getClientIp } from '@/lib/utils'
import { ActivityAction } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return apiError('Invite-only registration is required', 403)
    if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)

    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 422)
    }

    const storeId = getSessionStoreId(session)
    const user = await authService.register({ ...parsed.data, role: 'EMPLOYEE' }, storeId)

    await logActivity({
      storeId,
      userId: user.id,
      action: ActivityAction.CREATE,
      entity: 'user',
      entityId: user.id,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
      newValues: { name: user.name, email: user.email, role: user.role },
    })

    return apiSuccess(user, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    return apiError(message, 400)
  }
}
