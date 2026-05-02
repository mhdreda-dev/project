import { db } from '@/lib/db'
import { ActivityAction, Prisma } from '@prisma/client'

interface LogActivityParams {
  storeId?: string
  userId?: string
  action: ActivityAction
  entity: string
  entityId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        storeId: params.storeId ?? null,
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        oldValues: params.oldValues as Prisma.InputJsonValue | undefined,
        newValues: params.newValues as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    })
  } catch {
    // Never let logging errors break the main flow
    console.error('[ActivityLogger] Failed to log activity:', params.action, params.entity)
  }
}
