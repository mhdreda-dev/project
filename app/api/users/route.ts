import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { usersService } from '@/modules/users/users.service'
import { apiSuccess, apiError } from '@/lib/utils'
import { Role } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)

  const { searchParams } = req.nextUrl
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Number(searchParams.get('limit') ?? 20)
  const search = searchParams.get('search') ?? undefined
  const role = searchParams.get('role') as Role | undefined

  try {
    const result = await usersService.list({ page, limit, search, role })
    return apiSuccess(result)
  } catch {
    return apiError('Failed to fetch users', 500)
  }
}
