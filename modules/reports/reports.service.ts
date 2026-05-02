import { db } from '@/lib/db'
import { StoreScope } from '@/lib/store-context'
import { MovementType, Prisma } from '@prisma/client'

export type ReportPeriod = 'day' | 'week' | 'month' | 'year' | 'custom'

export interface ReportQuery {
  period: ReportPeriod
  from?: Date
  to?: Date
}

const ACTIVE_PRODUCT_SQL = Prisma.sql`p."isActive" = true AND p."deletedAt" IS NULL`

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
  async getSummary(query: ReportQuery, scope: StoreScope) {
    const { from, to } = getDateRange(query)
    const dateFilter = { gte: from, lte: to }

    const [totalProducts, totalUnits, movements, totalIn, totalOut, lowStockCount, inventoryValue] = await Promise.all([
      db.product.count({ where: { storeId: scope.storeId, isActive: true, deletedAt: null } }),
      db.productSize.aggregate({
        _sum: { quantity: true },
        where: { product: { storeId: scope.storeId, isActive: true, deletedAt: null } },
      }),
      db.stockMovement.count({
        where: { storeId: scope.storeId, createdAt: dateFilter, product: { isActive: true, deletedAt: null } },
      }),
      db.stockMovement.aggregate({
        _sum: { quantity: true },
        where: { storeId: scope.storeId, type: MovementType.IN, createdAt: dateFilter, product: { isActive: true, deletedAt: null } },
      }),
      db.stockMovement.aggregate({
        _sum: { quantity: true },
        where: { storeId: scope.storeId, type: MovementType.OUT, createdAt: dateFilter, product: { isActive: true, deletedAt: null } },
      }),
      db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT p.id, COALESCE(SUM(ps.quantity), 0) AS qty, p."lowStockThreshold" AS threshold
          FROM products p
          LEFT JOIN product_sizes ps ON ps."productId" = p.id
          WHERE p."storeId" = ${scope.storeId} AND ${ACTIVE_PRODUCT_SQL}
          GROUP BY p.id
        ) agg
        WHERE agg.qty <= agg.threshold
      `,
      db.$queryRaw<[{ retail_value: string; cost_value: string; expected_profit: string }]>`
        SELECT
          COALESCE(SUM(ps.quantity * COALESCE(ps.price, p.price, 0)), 0)::text AS retail_value,
          COALESCE(SUM(ps.quantity * COALESCE(ps."costPrice", p."costPrice", 0)), 0)::text AS cost_value,
          (
            COALESCE(SUM(ps.quantity * COALESCE(ps.price, p.price, 0)), 0)
            - COALESCE(SUM(ps.quantity * COALESCE(ps."costPrice", p."costPrice", 0)), 0)
          )::text AS expected_profit
        FROM product_sizes ps
        JOIN products p ON p.id = ps."productId"
        WHERE p."storeId" = ${scope.storeId} AND ${ACTIVE_PRODUCT_SQL}
      `,
    ])

    const values = inventoryValue[0]

    return {
      period: { from, to },
      totalProducts,
      totalUnits: totalUnits._sum.quantity ?? 0,
      totalMovements: movements,
      totalStockIn: totalIn._sum.quantity ?? 0,
      totalStockOut: totalOut._sum.quantity ?? 0,
      lowStockCount: Number(lowStockCount[0]?.count ?? 0),
      inventoryValue: parseFloat(values?.retail_value ?? '0'),
      retailValue: parseFloat(values?.retail_value ?? '0'),
      costValue: parseFloat(values?.cost_value ?? '0'),
      expectedProfit: parseFloat(values?.expected_profit ?? '0'),
    }
  }

  async getTopProductsByValue(scope: StoreScope, limit = 10) {
    const rows = await db.$queryRaw<Array<{
      id: string
      name: string
      sku: string
      imageUrl: string | null
      brandName: string | null
      totalUnits: number
      retailValue: string
      costValue: string
      expectedProfit: string
    }>>`
      SELECT
        p.id,
        p.name,
        p.sku,
        p."imageUrl",
        b.name AS "brandName",
        COALESCE(SUM(ps.quantity), 0)::int AS "totalUnits",
        COALESCE(SUM(ps.quantity * COALESCE(ps.price, p.price, 0)), 0)::text AS "retailValue",
        COALESCE(SUM(ps.quantity * COALESCE(ps."costPrice", p."costPrice", 0)), 0)::text AS "costValue",
        (
          COALESCE(SUM(ps.quantity * COALESCE(ps.price, p.price, 0)), 0)
          - COALESCE(SUM(ps.quantity * COALESCE(ps."costPrice", p."costPrice", 0)), 0)
        )::text AS "expectedProfit"
      FROM products p
      LEFT JOIN product_sizes ps ON ps."productId" = p.id
      LEFT JOIN brands b ON b.id = p."brandId"
      WHERE p."storeId" = ${scope.storeId} AND ${ACTIVE_PRODUCT_SQL}
      GROUP BY p.id, b.name
      ORDER BY COALESCE(SUM(ps.quantity * COALESCE(ps.price, p.price, 0)), 0) DESC, p.name ASC
      LIMIT ${limit}
    `

    return rows.map((row) => ({
      product: {
        id: row.id,
        name: row.name,
        sku: row.sku,
        imageUrl: row.imageUrl,
        brand: row.brandName ? { name: row.brandName } : null,
      },
      totalUnits: row.totalUnits,
      retailValue: parseFloat(row.retailValue),
      costValue: parseFloat(row.costValue),
      expectedProfit: parseFloat(row.expectedProfit),
    }))
  }

  async getBrandDistribution(scope: StoreScope, limit = 8) {
    const rows = await db.$queryRaw<Array<{
      id: string | null
      name: string
      productCount: number
      totalUnits: number
      retailValue: string
    }>>`
      SELECT
        b.id,
        COALESCE(b.name, 'No Brand') AS name,
        COUNT(DISTINCT p.id)::int AS "productCount",
        COALESCE(SUM(ps.quantity), 0)::int AS "totalUnits",
        COALESCE(SUM(ps.quantity * COALESCE(ps.price, p.price, 0)), 0)::text AS "retailValue"
      FROM products p
      LEFT JOIN brands b ON b.id = p."brandId"
      LEFT JOIN product_sizes ps ON ps."productId" = p.id
      WHERE p."storeId" = ${scope.storeId} AND ${ACTIVE_PRODUCT_SQL}
      GROUP BY b.id, b.name
      ORDER BY COALESCE(SUM(ps.quantity * COALESCE(ps.price, p.price, 0)), 0) DESC, name ASC
      LIMIT ${limit}
    `

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      productCount: row.productCount,
      totalUnits: row.totalUnits,
      retailValue: parseFloat(row.retailValue),
    }))
  }

  async getMovementTimeline(query: ReportQuery, scope: StoreScope) {
    const { from, to } = getDateRange(query)

    const movements = await db.stockMovement.findMany({
      where: { storeId: scope.storeId, createdAt: { gte: from, lte: to }, product: { isActive: true, deletedAt: null } },
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

  async getLowStockProducts(scope: StoreScope) {
    const rows = await db.$queryRaw<Array<{
      id: string
      name: string
      sku: string
      imageUrl: string | null
      brandName: string | null
      totalQty: number
      threshold: number
    }>>`
      SELECT
        p.id,
        p.name,
        p.sku,
        p."imageUrl",
        b.name AS "brandName",
        COALESCE(SUM(ps.quantity), 0)::int AS "totalQty",
        p."lowStockThreshold"::int AS threshold
      FROM products p
      LEFT JOIN product_sizes ps ON ps."productId" = p.id
      LEFT JOIN brands b ON b.id = p."brandId"
      WHERE p."storeId" = ${scope.storeId} AND ${ACTIVE_PRODUCT_SQL}
      GROUP BY p.id, b.name
      HAVING COALESCE(SUM(ps.quantity), 0) <= p."lowStockThreshold"
      ORDER BY COALESCE(SUM(ps.quantity), 0) ASC, p.name ASC
      LIMIT 20
    `

    return rows.map((row) => ({
      id: row.id,
      size: 'All',
      quantity: row.totalQty,
      minQuantity: row.threshold,
      product: {
        id: row.id,
        name: row.name,
        sku: row.sku,
        imageUrl: row.imageUrl,
        brand: row.brandName ? { name: row.brandName } : null,
      },
      totalQty: row.totalQty,
    }))
  }

  async getRecentStockMovements(scope: StoreScope, limit = 10) {
    return db.stockMovement.findMany({
      take: limit,
      where: { storeId: scope.storeId, product: { isActive: true, deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        productSize: { select: { size: true } },
        user: { select: { name: true } },
      },
    })
  }
}

export const reportsService = new ReportsService()
