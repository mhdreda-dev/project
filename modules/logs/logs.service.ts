import { db } from '@/lib/db'
import { ActivityAction } from '@prisma/client'
import { paginate, paginationMeta } from '@/lib/utils'

interface LogsQuery {
  page?: number
  limit?: number
  userId?: string
  action?: ActivityAction
  entity?: string
  from?: string
  to?: string
}

export class LogsService {
  async list(query: LogsQuery) {
    const { page = 1, limit = 20, userId, action, entity, from, to } = query

    const where = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(entity && { entity }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      db.activityLog.count({ where }),
    ])

    return { logs, meta: paginationMeta(total, page, limit) }
  }
}

export const logsService = new LogsService()
