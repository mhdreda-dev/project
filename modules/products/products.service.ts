import { db } from '@/lib/db'
import { paginate, paginationMeta } from '@/lib/utils'
import { CreateProductInput, UpdateProductInput, ProductQuery } from '@/lib/validations/product'

export class ProductsService {
  async list(query: ProductQuery) {
    const { page, limit, search, category, isActive, brandId } = query

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { category: { equals: category, mode: 'insensitive' as const } }),
      ...(isActive !== undefined && { isActive }),
      ...(brandId && { brandId }),
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          sizes: { orderBy: { size: 'asc' } },
          brand: { select: { id: true, name: true } },
          _count: { select: { movements: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      db.product.count({ where }),
    ])

    return { products, meta: paginationMeta(total, page, limit) }
  }

  async findById(id: string) {
    return db.product.findUnique({
      where: { id },
      include: {
        sizes: { orderBy: { size: 'asc' } },
        brand: { select: { id: true, name: true } },
        movements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })
  }

  async create(input: CreateProductInput) {
    const existingSku = await db.product.findUnique({ where: { sku: input.sku } })
    if (existingSku) throw new Error(`SKU "${input.sku}" already exists`)

    return db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          sku: input.sku.toUpperCase(),
          category: input.category ?? null,
          brandId: input.brandId ?? null,
          imageUrl: input.imageUrl ?? null,
          price: input.price,
          costPrice: input.costPrice ?? null,
          lowStockThreshold: input.lowStockThreshold ?? 5,
          isActive: input.isActive ?? true,
          sizes: {
            create: (input.sizes ?? []).map((s) => ({
              size: s.size,
              quantity: s.quantity ?? 0,
            })),
          },
        },
        include: { sizes: true, brand: { select: { id: true, name: true } } },
      })

      return product
    })
  }

  async update(id: string, input: UpdateProductInput) {
    const product = await db.product.findUnique({ where: { id } })
    if (!product) throw new Error('Product not found')

    if (input.sku && input.sku !== product.sku) {
      const conflict = await db.product.findFirst({
        where: { sku: input.sku, NOT: { id } },
      })
      if (conflict) throw new Error(`SKU "${input.sku}" already in use`)
    }

    return db.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.sku && { sku: input.sku.toUpperCase() }),
          ...(input.category !== undefined && { category: input.category }),
          ...(input.brandId !== undefined && { brandId: input.brandId ?? null }),
          ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
          ...(input.price !== undefined && { price: input.price }),
          ...(input.costPrice !== undefined && { costPrice: input.costPrice }),
          ...(input.lowStockThreshold !== undefined && { lowStockThreshold: input.lowStockThreshold }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      })

      if (input.sizes) {
        const existing = await tx.productSize.findMany({ where: { productId: id } })
        const incomingSizes = input.sizes.map((s) => s.size)

        // Delete sizes no longer present (only if they have no stock movements)
        const toDelete = existing.filter((e) => !incomingSizes.includes(e.size))
        for (const s of toDelete) {
          const hasMovements = await tx.stockMovement.count({ where: { productSizeId: s.id } })
          if (hasMovements === 0) {
            await tx.productSize.delete({ where: { id: s.id } })
          }
        }

        // Upsert each incoming size
        for (const s of input.sizes) {
          await tx.productSize.upsert({
            where: { productId_size: { productId: id, size: s.size } },
            update: { quantity: s.quantity ?? 0 },
            create: { productId: id, size: s.size, quantity: s.quantity ?? 0 },
          })
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: { sizes: true, brand: { select: { id: true, name: true } } },
      })
    })
  }

  async delete(id: string) {
    const product = await db.product.findUnique({ where: { id } })
    if (!product) throw new Error('Product not found')

    await db.product.delete({ where: { id } })
  }

  async getCategories(): Promise<string[]> {
    const result = await db.product.groupBy({
      by: ['category'],
      where: { category: { not: null }, isActive: true },
      orderBy: { category: 'asc' },
    })
    return result.map((r) => r.category!).filter(Boolean)
  }

  async getDashboardStats() {
    const [totalProducts, totalSizes, recentMovements, lowStockCount] = await Promise.all([
      db.product.count({ where: { isActive: true } }),
      db.productSize.aggregate({
        _sum: { quantity: true },
        where: { product: { isActive: true } },
      }),
      db.stockMovement.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // low-stock: product whose total qty across sizes <= product.lowStockThreshold
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
    ])

    const totalValue = await db.$queryRaw<[{ total: string }]>`
      SELECT COALESCE(SUM(ps.quantity * p.price), 0)::text AS total
      FROM product_sizes ps
      JOIN products p ON p.id = ps."productId"
      WHERE p."isActive" = true
    `

    return {
      totalProducts,
      totalStock: totalSizes._sum.quantity ?? 0,
      lowStockCount: Number(lowStockCount[0]?.count ?? 0),
      recentMovements,
      totalInventoryValue: parseFloat(totalValue[0]?.total ?? '0'),
    }
  }
}

export const productsService = new ProductsService()
