import { db } from '@/lib/db'
import { paginate, paginationMeta } from '@/lib/utils'
import { CreateProductInput, UpdateProductInput, ProductQuery } from '@/lib/validations/product'

export class ProductsService {
  async list(query: ProductQuery) {
    const { page, limit, search, category, isActive } = query

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
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          sizes: {
            orderBy: { size: 'asc' },
          },
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

    // Atomic: create product + sizes in a single transaction
    return db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          description: input.description,
          sku: input.sku.toUpperCase(),
          category: input.category,
          imageUrl: input.imageUrl,
          sizes: {
            create: input.sizes.map((s) => ({
              size: s.size,
              quantity: s.quantity,
              minQuantity: s.minQuantity,
              maxQuantity: s.maxQuantity,
              price: s.price,
              costPrice: s.costPrice,
            })),
          },
        },
        include: { sizes: true },
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

    return db.product.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.sku && { sku: input.sku.toUpperCase() }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      include: { sizes: true },
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
    const [totalProducts, totalSizes, lowStock, recentMovements] = await Promise.all([
      db.product.count({ where: { isActive: true } }),
      db.productSize.aggregate({
        _sum: { quantity: true },
        where: { product: { isActive: true } },
      }),
      db.productSize.count({
        where: {
          quantity: { lte: db.productSize.fields.minQuantity },
          product: { isActive: true },
        },
      }),
      db.stockMovement.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    const totalValue = await db.$queryRaw<[{ total: number }]>`
      SELECT COALESCE(SUM(ps.quantity * ps.price), 0) AS total
      FROM product_sizes ps
      JOIN products p ON p.id = ps."productId"
      WHERE p."isActive" = true
    `

    return {
      totalProducts,
      totalStock: totalSizes._sum.quantity ?? 0,
      lowStockCount: lowStock,
      recentMovements,
      totalInventoryValue: Number(totalValue[0]?.total ?? 0),
    }
  }
}

export const productsService = new ProductsService()
