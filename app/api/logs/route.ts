import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { logsService } from '@/modules/logs/logs.service'
import { apiSuccess, apiError } from '@/lib/utils'
import { ActivityAction } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)

  const { searchParams } = req.nextUrl
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Number(searchParams.get('limit') ?? 20)
  const userId = searchParams.get('userId') ?? undefined
  const action = searchParams.get('action') as ActivityAction | undefined
  const entity = searchParams.get('entity') ?? undefined
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  try {
    const result = await logsService.list({ page, limit, userId, action, entity, from, to })
    return apiSuccess(result)
  } catch {
    return apiError('Failed to fetch logs', 500)
  }
}
