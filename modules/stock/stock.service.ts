import { db } from '@/lib/db'
import { paginate, paginationMeta } from '@/lib/utils'
import { StockMovementInput, StockQuery } from '@/lib/validations/stock'
import { MovementType } from '@prisma/client'

export class StockService {
  async recordMovement(input: StockMovementInput, userId: string) {
    return db.$transaction(async (tx) => {
      // Lock the size row for update
      const size = await tx.productSize.findUnique({
        where: { id: input.productSizeId },
        include: { product: true },
      })

      if (!size) throw new Error('Product size not found')
      if (!size.product.isActive) throw new Error('Product is not active')

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

      return movement
    })
  }

  async list(query: StockQuery) {
    const { page, limit, productId, type, from, to } = query

    const where = {
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

  async getLowStock() {
    const products = await db.product.findMany({
      where: { isActive: true },
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

  async getMovementChart(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const movements = await db.$queryRaw<
      Array<{ date: string; in_qty: number; out_qty: number }>
    >`
      SELECT
        DATE("createdAt")::text AS date,
        COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0) AS in_qty,
        COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS out_qty
      FROM stock_movements
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `

    return movements
  }
}

export const stockService = new StockService()
