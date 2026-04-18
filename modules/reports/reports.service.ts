import { db } from '@/lib/db'
import { MovementType } from '@prisma/client'

export type ReportPeriod = 'day' | 'week' | 'month' | 'year' | 'custom'

export interface ReportQuery {
  period: ReportPeriod
  from?: Date
  to?: Date
}

function getDateRange(query: ReportQuery): { from: Date; to: Date } {
  const now = new Date()
  const to = query.to ?? now

  if (query.period === 'custom' && query.from) {
    return { from: query.from, to }
  }

  const from = new Date(now)
  if (query.period === 'day') {
    from.setHours(0, 0, 0, 0)
  } else if (query.period === 'week') {
    from.setDate(now.getDate() - 7)
  } else if (query.period === 'month') {
    from.setMonth(now.getMonth() - 1)
  } else if (query.period === 'year') {
    from.setFullYear(now.getFullYear() - 1)
  }
  return { from, to }
}

export class ReportsService {
  async getSummary(query: ReportQuery) {
    const { from, to } = getDateRange(query)
    const dateFilter = { gte: from, lte: to }

    const [movements, totalIn, totalOut, lowStockCount, inventoryValue] = await Promise.all([
      db.stockMovement.count({ where: { createdAt: dateFilter } }),
      db.stockMovement.aggregate({
        _sum: { quantity: true },
        where: { type: MovementType.IN, createdAt: dateFilter },
      }),
      db.stockMovement.aggregate({
        _sum: { quantity: true },
        where: { type: MovementType.OUT, createdAt: dateFilter },
      }),
      db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT p.id, COALESCE(SUM(ps.quantity), 0) AS qty, p."lowStockThreshold" AS threshold
          FROM products p
          LEFT JOIN product_sizes ps ON ps."productId" = p.id
          WHERE p."isActive" = true
          GROUP BY p.id
        ) agg
        WHERE agg.qty <= agg.threshold
      `,
      db.$queryRaw<[{ total: string }]>`
        SELECT COALESCE(SUM(ps.quantity * p.price), 0)::text AS total
        FROM product_sizes ps
        JOIN products p ON p.id = ps."productId"
        WHERE p."isActive" = true
      `,
    ])

    return {
      period: { from, to },
      totalMovements: movements,
      totalStockIn: totalIn._sum.quantity ?? 0,
      totalStockOut: totalOut._sum.quantity ?? 0,
      lowStockCount: Number(lowStockCount[0]?.count ?? 0),
      inventoryValue: parseFloat(inventoryValue[0]?.total ?? '0'),
    }
  }

  async getTopProducts(query: ReportQuery, limit = 10) {
    const { from, to } = getDateRange(query)

    const movements = await db.stockMovement.groupBy({
      by: ['productId'],
      where: { type: MovementType.OUT, createdAt: { gte: from, lte: to } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    })

    const productIds = movements.map((m) => m.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, imageUrl: true, brand: { select: { name: true } } },
    })

    return movements.map((m) => ({
      product: products.find((p) => p.id === m.productId),
      totalOut: m._sum.quantity ?? 0,
    }))
  }

  async getTopBrands(query: ReportQuery, limit = 8) {
    const { from, to } = getDateRange(query)

    const movements = await db.stockMovement.findMany({
      where: { type: MovementType.OUT, createdAt: { gte: from, lte: to } },
      select: {
        quantity: true,
        product: { select: { brand: { select: { id: true, name: true } } } },
      },
    })

    const brandMap = new Map<string, { name: string; total: number }>()
    for (const m of movements) {
      const brand = m.product.brand
      if (!brand) continue
      const existing = brandMap.get(brand.id) ?? { name: brand.name, total: 0 }
      existing.total += m.quantity
      brandMap.set(brand.id, existing)
    }

    return Array.from(brandMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
  }

  async getMovementTimeline(query: ReportQuery) {
    const { from, to } = getDateRange(query)

    const movements = await db.stockMovement.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { type: true, quantity: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const grouped = new Map<string, { in: number; out: number; date: string }>()
    for (const m of movements) {
      const dateKey = m.createdAt.toISOString().split('T')[0]
      const existing = grouped.get(dateKey) ?? { in: 0, out: 0, date: dateKey }
      if (m.type === MovementType.IN) existing.in += m.quantity
      else if (m.type === MovementType.OUT) existing.out += m.quantity
      grouped.set(dateKey, existing)
    }

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date))
  }

  async getLowStockProducts() {
    // Low stock = product whose total quantity across sizes <= product.lowStockThreshold
    const products = await db.product.findMany({
      where: { isActive: true },
      include: {
        sizes: { select: { id: true, size: true, quantity: true } },
        brand: { select: { name: true } },
      },
      take: 50,
    })

    const flagged = products
      .map((p) => {
        const totalQty = p.sizes.reduce((s, sz) => s + sz.quantity, 0)
        return { product: p, totalQty }
      })
      .filter(({ product, totalQty }) => totalQty <= product.lowStockThreshold)
      .sort((a, b) => a.totalQty - b.totalQty)
      .slice(0, 20)

    // Return rows shaped like the previous API (one row per low-stock size) for UI compat
    return flagged.flatMap(({ product, totalQty }) =>
      product.sizes.map((sz) => ({
        id: sz.id,
        size: sz.size,
        quantity: sz.quantity,
        minQuantity: product.lowStockThreshold,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          imageUrl: product.imageUrl,
          brand: product.brand,
        },
        totalQty,
      })),
    )
  }
}

export const reportsService = new ReportsService()
