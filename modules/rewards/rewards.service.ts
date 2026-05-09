import { db } from '@/lib/db'
import { StoreScope } from '@/lib/store-context'
import { RewardActionType, Prisma } from '@prisma/client'

const PRODUCT_ADDED_REWARD_MAD = 1
const PRODUCT_SOLD_REWARD_MAD = 3
const WEEKLY_SALES_TARGET_MAD = 2500

type RewardTx = Prisma.TransactionClient

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfWeek() {
  const date = startOfToday()
  const day = date.getDay()
  const diff = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - diff)
  return date
}

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  return Number(value ?? 0)
}

function getMovementSaleAmount(movement: {
  quantity: number
  product: { price: Prisma.Decimal | number }
  productSize: { price: Prisma.Decimal | number | null }
}) {
  return movement.quantity * toNumber(movement.productSize.price ?? movement.product.price)
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

  async getEmployeeWalletDashboard(userId: string, scope: StoreScope) {
    const today = startOfToday()
    const week = startOfWeek()

    const [todayMovements, weekMovements, totalCommission, todayCommission, weekCommission, latestSales] = await Promise.all([
      db.stockMovement.findMany({
        where: { userId, storeId: scope.storeId, type: 'OUT', createdAt: { gte: today } },
        select: {
          quantity: true,
          product: { select: { price: true } },
          productSize: { select: { price: true } },
        },
      }),
      db.stockMovement.findMany({
        where: { userId, storeId: scope.storeId, type: 'OUT', createdAt: { gte: week } },
        select: {
          quantity: true,
          product: { select: { price: true } },
          productSize: { select: { price: true } },
        },
      }),
      db.rewardEvent.aggregate({
        where: { userId, storeId: scope.storeId, actionType: RewardActionType.PRODUCT_SOLD },
        _sum: { rewardAmountMAD: true },
      }),
      db.rewardEvent.aggregate({
        where: { userId, storeId: scope.storeId, actionType: RewardActionType.PRODUCT_SOLD, createdAt: { gte: today } },
        _sum: { rewardAmountMAD: true },
      }),
      db.rewardEvent.aggregate({
        where: { userId, storeId: scope.storeId, actionType: RewardActionType.PRODUCT_SOLD, createdAt: { gte: week } },
        _sum: { rewardAmountMAD: true },
      }),
      db.rewardEvent.findMany({
        where: { userId, storeId: scope.storeId, actionType: RewardActionType.PRODUCT_SOLD },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, sku: true } } },
      }),
    ])

    const soldToday = todayMovements.reduce((sum, movement) => sum + movement.quantity, 0)
    const soldThisWeek = weekMovements.reduce((sum, movement) => sum + movement.quantity, 0)
    const salesAmountToday = todayMovements.reduce((sum, movement) => sum + getMovementSaleAmount(movement), 0)
    const salesAmountThisWeek = weekMovements.reduce((sum, movement) => sum + getMovementSaleAmount(movement), 0)
    const weeklyProgressPercent = WEEKLY_SALES_TARGET_MAD > 0
      ? Math.min(100, Math.round((salesAmountThisWeek / WEEKLY_SALES_TARGET_MAD) * 100))
      : 0

    return {
      soldToday,
      salesAmountToday,
      soldThisWeek,
      salesAmountThisWeek,
      walletBalanceMAD: toNumber(totalCommission._sum.rewardAmountMAD),
      pendingPayoutMAD: toNumber(totalCommission._sum.rewardAmountMAD),
      commissionTodayMAD: toNumber(todayCommission._sum.rewardAmountMAD),
      commissionThisWeekMAD: toNumber(weekCommission._sum.rewardAmountMAD),
      weeklyTargetMAD: WEEKLY_SALES_TARGET_MAD,
      weeklyProgressPercent,
      commissionPerUnitMAD: PRODUCT_SOLD_REWARD_MAD,
      latestSales: latestSales.map((event) => ({
        ...event,
        rewardAmountMAD: toNumber(event.rewardAmountMAD),
      })),
    }
  }

  async getEmployeeWalletOverview(scope: StoreScope) {
    const today = startOfToday()
    const week = startOfWeek()

    const [users, todayMovements, weekMovements, commissions, weekCommissions] = await Promise.all([
      db.user.findMany({
        where: { role: 'EMPLOYEE', storeId: scope.storeId },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
      db.stockMovement.findMany({
        where: { storeId: scope.storeId, type: 'OUT', createdAt: { gte: today }, user: { role: 'EMPLOYEE' } },
        select: {
          userId: true,
          quantity: true,
          product: { select: { price: true } },
          productSize: { select: { price: true } },
        },
      }),
      db.stockMovement.findMany({
        where: { storeId: scope.storeId, type: 'OUT', createdAt: { gte: week }, user: { role: 'EMPLOYEE' } },
        select: {
          userId: true,
          quantity: true,
          product: { select: { price: true } },
          productSize: { select: { price: true } },
        },
      }),
      db.rewardEvent.groupBy({
        by: ['userId'],
        where: { storeId: scope.storeId, actionType: RewardActionType.PRODUCT_SOLD, user: { role: 'EMPLOYEE' } },
        _sum: { rewardAmountMAD: true },
      }),
      db.rewardEvent.groupBy({
        by: ['userId'],
        where: { storeId: scope.storeId, actionType: RewardActionType.PRODUCT_SOLD, createdAt: { gte: week }, user: { role: 'EMPLOYEE' } },
        _sum: { rewardAmountMAD: true },
      }),
    ])

    const todayByUser = new Map<string, { sold: number; amount: number }>()
    for (const movement of todayMovements) {
      const current = todayByUser.get(movement.userId) ?? { sold: 0, amount: 0 }
      current.sold += movement.quantity
      current.amount += getMovementSaleAmount(movement)
      todayByUser.set(movement.userId, current)
    }

    const weekByUser = new Map<string, { sold: number; amount: number }>()
    for (const movement of weekMovements) {
      const current = weekByUser.get(movement.userId) ?? { sold: 0, amount: 0 }
      current.sold += movement.quantity
      current.amount += getMovementSaleAmount(movement)
      weekByUser.set(movement.userId, current)
    }

    const commissionByUser = new Map(commissions.map((row) => [row.userId, toNumber(row._sum.rewardAmountMAD)]))
    const weekCommissionByUser = new Map(weekCommissions.map((row) => [row.userId, toNumber(row._sum.rewardAmountMAD)]))

    return users
      .map((user) => {
        const todayStats = todayByUser.get(user.id) ?? { sold: 0, amount: 0 }
        const weekStats = weekByUser.get(user.id) ?? { sold: 0, amount: 0 }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          soldToday: todayStats.sold,
          salesAmountToday: todayStats.amount,
          soldThisWeek: weekStats.sold,
          salesAmountThisWeek: weekStats.amount,
          walletBalanceMAD: commissionByUser.get(user.id) ?? 0,
          pendingPayoutMAD: commissionByUser.get(user.id) ?? 0,
          commissionThisWeekMAD: weekCommissionByUser.get(user.id) ?? 0,
          weeklyProgressPercent: WEEKLY_SALES_TARGET_MAD > 0
            ? Math.min(100, Math.round((weekStats.amount / WEEKLY_SALES_TARGET_MAD) * 100))
            : 0,
        }
      })
      .sort((a, b) => b.salesAmountThisWeek - a.salesAmountThisWeek)
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
