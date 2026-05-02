import { db } from '@/lib/db'
import { StoreScope } from '@/lib/store-context'
import { RewardActionType, Prisma } from '@prisma/client'

const PRODUCT_ADDED_REWARD_MAD = 1
const PRODUCT_SOLD_REWARD_MAD = 3

type RewardTx = Prisma.TransactionClient

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  return Number(value ?? 0)
}

export class RewardsService {
  createProductAddedEvent(tx: RewardTx, userId: string, productId: string, storeId: string) {
    return tx.rewardEvent.create({
      data: {
        storeId,
        userId,
        productId,
        actionType: RewardActionType.PRODUCT_ADDED,
        quantity: 1,
        rewardAmountMAD: PRODUCT_ADDED_REWARD_MAD,
      },
    })
  }

  createProductSoldEvent(tx: RewardTx, userId: string, productId: string, quantity: number, storeId: string) {
    return tx.rewardEvent.create({
      data: {
        storeId,
        userId,
        productId,
        actionType: RewardActionType.PRODUCT_SOLD,
        quantity,
        rewardAmountMAD: quantity * PRODUCT_SOLD_REWARD_MAD,
      },
    })
  }

  async getEmployeeSummary(userId: string, scope: StoreScope) {
    const today = startOfToday()

    const [total, todayTotal, added, sold, addedToday, soldToday, latestEvents] = await Promise.all([
      db.rewardEvent.aggregate({
        where: { userId, storeId: scope.storeId },
        _sum: { rewardAmountMAD: true },
      }),
      db.rewardEvent.aggregate({
        where: { userId, storeId: scope.storeId, createdAt: { gte: today } },
        _sum: { rewardAmountMAD: true },
      }),
      db.rewardEvent.aggregate({
        where: { userId, storeId: scope.storeId, actionType: RewardActionType.PRODUCT_ADDED },
        _sum: { quantity: true },
      }),
      db.rewardEvent.aggregate({
        where: { userId, storeId: scope.storeId, actionType: RewardActionType.PRODUCT_SOLD },
        _sum: { quantity: true },
      }),
      db.rewardEvent.aggregate({
        where: { userId, storeId: scope.storeId, actionType: RewardActionType.PRODUCT_ADDED, createdAt: { gte: today } },
        _sum: { quantity: true },
      }),
      db.rewardEvent.aggregate({
        where: { userId, storeId: scope.storeId, actionType: RewardActionType.PRODUCT_SOLD, createdAt: { gte: today } },
        _sum: { quantity: true },
      }),
      db.rewardEvent.findMany({
        where: { userId, storeId: scope.storeId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, sku: true } } },
      }),
    ])

    return {
      totalRewardsMAD: toNumber(total._sum.rewardAmountMAD),
      rewardsTodayMAD: toNumber(todayTotal._sum.rewardAmountMAD),
      productsAddedCount: added._sum.quantity ?? 0,
      productsSoldCount: sold._sum.quantity ?? 0,
      productsAddedTodayCount: addedToday._sum.quantity ?? 0,
      productsSoldTodayCount: soldToday._sum.quantity ?? 0,
      latestEvents: latestEvents.map((event) => ({
        ...event,
        rewardAmountMAD: toNumber(event.rewardAmountMAD),
      })),
    }
  }

  async getLeaderboard(scope: StoreScope) {
    const users = await db.user.findMany({
      where: { role: 'EMPLOYEE', storeId: scope.storeId },
      select: {
        id: true,
        name: true,
        email: true,
        rewardEvents: {
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    })

    const totals = await db.rewardEvent.groupBy({
      by: ['userId'],
      where: { storeId: scope.storeId },
      _sum: { rewardAmountMAD: true, quantity: true },
    })
    const added = await db.rewardEvent.groupBy({
      by: ['userId'],
      where: { storeId: scope.storeId, actionType: RewardActionType.PRODUCT_ADDED },
      _sum: { quantity: true },
    })
    const sold = await db.rewardEvent.groupBy({
      by: ['userId'],
      where: { storeId: scope.storeId, actionType: RewardActionType.PRODUCT_SOLD },
      _sum: { quantity: true },
    })

    const totalsByUser = new Map(totals.map((row) => [row.userId, row]))
    const addedByUser = new Map(added.map((row) => [row.userId, row._sum.quantity ?? 0]))
    const soldByUser = new Map(sold.map((row) => [row.userId, row._sum.quantity ?? 0]))

    return users
      .map((user) => {
        const total = totalsByUser.get(user.id)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          totalRewardsMAD: toNumber(total?._sum.rewardAmountMAD),
          productsAddedCount: addedByUser.get(user.id) ?? 0,
          productsSoldCount: soldByUser.get(user.id) ?? 0,
          latestActivity: user.rewardEvents[0]?.createdAt ?? null,
        }
      })
      .sort((a, b) => b.totalRewardsMAD - a.totalRewardsMAD)
  }
}

export const rewardsService = new RewardsService()
