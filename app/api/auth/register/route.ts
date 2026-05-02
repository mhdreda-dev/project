import { NextRequest } from 'next/server'
import { registerSchema } from '@/lib/validations/auth'
import { auth } from '@/lib/auth'
import { DEFAULT_STORE_ID, getSessionStoreId } from '@/lib/store-context'
import { authService } from '@/modules/auth/auth.service'
import { logActivity } from '@/lib/activity-logger'
import { apiSuccess, apiError, getClientIp } from '@/lib/utils'
import { ActivityAction } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 422)
    }

    const storeId = session?.user.role === 'ADMIN'
      ? getSessionStoreId(session)
      : DEFAULT_STORE_ID
    const user = await authService.register(parsed.data, storeId)

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
