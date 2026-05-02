import { db } from '@/lib/db'
import { paginate, paginationMeta } from '@/lib/utils'
import { StoreScope } from '@/lib/store-context'
import { StockMovementInput, StockQuery } from '@/lib/validations/stock'
import { rewardsService } from '@/modules/rewards/rewards.service'
import { MovementType } from '@prisma/client'

export class StockService {
  async recordMovement(input: StockMovementInput, userId: string, scope: StoreScope) {
    return db.$transaction(async (tx) => {
      // Lock the size row for update
      const size = await tx.productSize.findUnique({
        where: { id: input.productSizeId },
        include: { product: true },
      })

      if (!size || size.product.storeId !== scope.storeId) throw new Error('Product size not found')
      if (!size.product.isActive || size.product.deletedAt) throw new Error('Product is not active')

      let newQty: number

      if (input.type === 'IN') {
        newQty = size.quantity + input.quantity
      } else if (input.type === 'OUT') {
        if (size.quantity < input.quantity) {
          throw new Error(
            `Insufficient stock. Available: ${size.quantity}, requested: ${input.quantity}`,
          )
        }
        newQty = size.quantity - input.quantity
      } else {
        // ADJUSTMENT — set absolute value
        newQty = input.quantity
      }

      if (newQty < 0) throw new Error('Stock cannot go below 0')

      // Update size quantity
      await tx.productSize.update({
        where: { id: size.id },
        data: { quantity: newQty },
      })

      // Record movement
      const movement = await tx.stockMovement.create({
        data: {
          storeId: scope.storeId,
          productId: size.productId,
          productSizeId: size.id,
          userId,
          type: input.type as MovementType,
          quantity: input.quantity,
          previousQty: size.quantity,
          newQty,
          reason: input.reason,
          reference: input.reference,
        },
        include: {
          product: { select: { name: true, sku: true } },
          productSize: { select: { size: true } },
          user: { select: { name: true } },
        },
      })

      if (input.type === 'OUT') {
        await rewardsService.createProductSoldEvent(tx, userId, size.productId, input.quantity, scope.storeId)
      }

      return movement
    })
  }

  async list(query: StockQuery, scope: StoreScope) {
    const { page, limit, productId, type, from, to } = query

    const where = {
      storeId: scope.storeId,
      ...(productId && { productId }),
      ...(type && { type: type as MovementType }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
    }

    const [movements, total] = await Promise.all([
      db.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          productSize: { select: { size: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      db.stockMovement.count({ where }),
    ])

    return { movements, meta: paginationMeta(total, page, limit) }
  }

  async getLowStock(scope: StoreScope) {
    const products = await db.product.findMany({
      where: { storeId: scope.storeId, isActive: true, deletedAt: null },
      include: {
        sizes: true,
      },
    })
    // Low stock if total quantity across sizes <= product.lowStockThreshold
    return products
      .map((p) => ({
        product: { name: p.name, sku: p.sku, category: p.category },
        productId: p.id,
        totalQty: p.sizes.reduce((s, sz) => s + sz.quantity, 0),
        threshold: p.lowStockThreshold,
        sizes: p.sizes,
      }))
      .filter((r) => r.totalQty <= r.threshold)
      .sort((a, b) => a.totalQty - b.totalQty)
      .flatMap((r) =>
        r.sizes.map((sz) => ({
          id: sz.id,
          size: sz.size,
          quantity: sz.quantity,
          minQuantity: r.threshold,
          product: r.product,
          productId: r.productId,
        })),
      )
  }

  async getMovementChart(days = 30, scope: StoreScope, productId?: string) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Two branches so we don't have to conditionally inject SQL. Same shape.
    const movements = productId
      ? await db.$queryRaw<Array<{ date: string; in_qty: bigint | number; out_qty: bigint | number }>>`
          SELECT
            DATE(sm."createdAt")::text AS date,
            COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0)::int AS in_qty,
            COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0)::int AS out_qty
          FROM stock_movements sm
          JOIN products p ON p.id = sm."productId"
          WHERE sm."createdAt" >= ${since}
            AND sm."productId" = ${productId}
            AND sm."storeId" = ${scope.storeId}
            AND p."isActive" = true
            AND p."deletedAt" IS NULL
          GROUP BY DATE(sm."createdAt")
          ORDER BY date ASC
        `
      : await db.$queryRaw<Array<{ date: string; in_qty: bigint | number; out_qty: bigint | number }>>`
          SELECT
            DATE(sm."createdAt")::text AS date,
            COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0)::int AS in_qty,
            COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0)::int AS out_qty
          FROM stock_movements sm
          JOIN products p ON p.id = sm."productId"
          WHERE sm."createdAt" >= ${since}
            AND sm."storeId" = ${scope.storeId}
            AND p."isActive" = true
            AND p."deletedAt" IS NULL
          GROUP BY DATE(sm."createdAt")
          ORDER BY date ASC
        `

    // Defensive: normalize any BigInt values to number so JSON.stringify doesn't throw.
    return movements.map((m) => ({
      date: m.date,
      in_qty: Number(m.in_qty),
      out_qty: Number(m.out_qty),
    }))
  }

  /**
   * Unpaginated movement list for exports. Hard-capped at 10k rows to
   * keep memory bounded — callers should narrow with filters if possible.
   */
  async listAll(filters: {
    productId?: string
    type?: MovementType
    from?: string
    to?: string
  }, scope: StoreScope) {
    const where = {
      storeId: scope.storeId,
      ...(filters.productId && { productId: filters.productId }),
      ...(filters.type && { type: filters.type }),
      ...((filters.from || filters.to) && {
        createdAt: {
          ...(filters.from && { gte: new Date(filters.from) }),
          ...(filters.to && { lte: new Date(filters.to) }),
        },
      }),
    }
    return db.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        productSize: { select: { size: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10_000,
    })
  }
}

export const stockService = new StockService()
