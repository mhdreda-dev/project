import { db } from '@/lib/db'
import { paginate, paginationMeta } from '@/lib/utils'
import { DEFAULT_STORE_ID, StoreScope } from '@/lib/store-context'
import { CreateProductInput, UpdateProductInput, ProductQuery } from '@/lib/validations/product'
import { rewardsService } from '@/modules/rewards/rewards.service'

// Convert Prisma Decimal fields to plain numbers so Server Components can
// safely pass results to Client Components (Decimal objects aren't serializable).
function serializeProduct<T extends Record<string, any> | null | undefined>(p: T): T {
  if (!p) return p
  const out: any = { ...p }
  if (out.price != null) out.price = Number(out.price)
  if (out.costPrice != null) out.costPrice = Number(out.costPrice)
  if (Array.isArray(out.sizes)) {
    out.sizes = out.sizes.map((s: any) => ({
      ...s,
      ...(s.price != null ? { price: Number(s.price) } : {}),
      ...(s.costPrice != null ? { costPrice: Number(s.costPrice) } : {}),
    }))
  }
  if (Array.isArray(out.variants)) {
    out.variants = out.variants.map((v: any) => ({
      ...v,
      sizes: Array.isArray(v.sizes)
        ? v.sizes.map((s: any) => ({
            ...s,
            ...(s.price != null ? { price: Number(s.price) } : {}),
            ...(s.costPrice != null ? { costPrice: Number(s.costPrice) } : {}),
          }))
        : [],
      images: Array.isArray(v.images) ? v.images : [],
    }))
  }
  return out as T
}

function hideFinancialProductFields<T extends Record<string, any> | null | undefined>(p: T): T {
  if (!p) return p
  const out: any = { ...p }
  delete out.costPrice
  if (Array.isArray(out.sizes)) {
    out.sizes = out.sizes.map((s: any) => {
      const safe = { ...s }
      delete safe.costPrice
      delete safe.price
      return safe
    })
  }
  if (Array.isArray(out.variants)) {
    out.variants = out.variants.map((variant: any) => ({
      ...variant,
      sizes: Array.isArray(variant.sizes)
        ? variant.sizes.map((s: any) => {
            const safe = { ...s }
            delete safe.costPrice
            delete safe.price
            return safe
          })
        : [],
    }))
  }
  return out as T
}

function brandStoreWhere(storeId: string) {
  return storeId === DEFAULT_STORE_ID
    ? { OR: [{ storeId }, { storeId: null }] }
    : { storeId }
}

export class ProductsService {
  async list(query: ProductQuery, scope: StoreScope, options: { includeFinancials?: boolean } = {}) {
    const { page, limit, search, category, isActive, brandId } = query

    const where = {
      storeId: scope.storeId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { category: { equals: category, mode: 'insensitive' as const } }),
      ...(isActive !== undefined && { isActive }),
      ...(brandId && { brandId, brand: brandStoreWhere(scope.storeId) }),
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          sizes: { orderBy: { size: 'asc' } },
          variants: {
            orderBy: { sortOrder: 'asc' },
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              sizes: { orderBy: { size: 'asc' } },
            },
          },
          brand: { select: { id: true, name: true } },
          _count: { select: { movements: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      db.product.count({ where }),
    ])

    const serialized = products.map(serializeProduct)
    return {
      products: options.includeFinancials ? serialized : serialized.map(hideFinancialProductFields),
      meta: paginationMeta(total, page, limit),
    }
  }

  /**
   * Unpaginated, filter-aware product list for CSV export.
   * Includes totalStock (aggregated across sizes) because that's the column
   * operators expect in the export.
   */
  async listAll(filters: { search?: string; category?: string; brandId?: string; isActive?: boolean }, scope: StoreScope) {
    const where = {
      storeId: scope.storeId,
      deletedAt: null,
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { sku: { contains: filters.search, mode: 'insensitive' as const } },
          { description: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(filters.category && { category: { equals: filters.category, mode: 'insensitive' as const } }),
      ...(filters.brandId && { brandId: filters.brandId, brand: brandStoreWhere(scope.storeId) }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    }
    const rows = await db.product.findMany({
      where,
      include: {
        brand: { select: { name: true } },
        sizes: { select: { size: true, quantity: true } },
        variants: {
          select: {
            colorName: true,
            sizes: { select: { size: true, quantity: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10_000,
    })
    return rows.map(serializeProduct)
  }

  async findById(id: string, scope: StoreScope, options: { includeFinancials?: boolean } = {}) {
    const p = await db.product.findFirst({
      where: { id, storeId: scope.storeId, deletedAt: null },
      include: {
        sizes: { orderBy: { size: 'asc' } },
        variants: {
          orderBy: { sortOrder: 'asc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            sizes: { orderBy: { size: 'asc' } },
          },
        },
        brand: { select: { id: true, name: true } },
        movements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })
    const product = serializeProduct(p)
    return options.includeFinancials ? product : hideFinancialProductFields(product)
  }

  async create(input: CreateProductInput, scope: StoreScope, userId?: string) {
    const existingSku = await db.product.findUnique({ where: { sku: input.sku } })
    if (existingSku) throw new Error(`SKU "${input.sku}" already exists`)

    return db.$transaction(async (tx) => {
      if (input.brandId) {
        const brand = await tx.brand.findFirst({
          where: { id: input.brandId, ...brandStoreWhere(scope.storeId), isActive: true },
          select: { id: true },
        })
        if (!brand) throw new Error('Brand not found')
      }

      const product = await tx.product.create({
        data: {
          storeId: scope.storeId,
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
            create: (input.variants?.length ? [] : input.sizes ?? []).map((s) => ({
              size: s.size,
              quantity: s.quantity ?? 0,
            })),
          },
        },
        include: {
          sizes: true,
          variants: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              sizes: { orderBy: { size: 'asc' } },
            },
            orderBy: { sortOrder: 'asc' },
          },
          brand: { select: { id: true, name: true } },
        },
      })

      if (input.variants?.length) {
        await this.replaceVariants(tx, product.id, input.variants)
      }

      if (userId) {
        await rewardsService.createProductAddedEvent(tx, userId, product.id, scope.storeId)
      }

      const result = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          sizes: { orderBy: { size: 'asc' } },
          variants: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              sizes: { orderBy: { size: 'asc' } },
            },
            orderBy: { sortOrder: 'asc' },
          },
          brand: { select: { id: true, name: true } },
        },
      })
      if (!result) throw new Error('Product not found after create')

      return serializeProduct(result)
    })
  }

  async update(id: string, input: UpdateProductInput, scope: StoreScope) {
    const product = await db.product.findFirst({ where: { id, storeId: scope.storeId, deletedAt: null } })
    if (!product) throw new Error('Product not found')

    if (input.sku && input.sku !== product.sku) {
      const conflict = await db.product.findFirst({
        where: { sku: input.sku, NOT: { id } },
      })
      if (conflict) throw new Error(`SKU "${input.sku}" already in use`)
    }

    return db.$transaction(async (tx) => {
      if (input.brandId) {
        const brand = await tx.brand.findFirst({
          where: { id: input.brandId, ...brandStoreWhere(scope.storeId), isActive: true },
          select: { id: true },
        })
        if (!brand) throw new Error('Brand not found')
      }

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
        const existing = await tx.productSize.findMany({ where: { productId: id, variantId: null } })
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
          const existingSize = existing.find((row) => row.size === s.size)
          if (existingSize) {
            await tx.productSize.update({
              where: { id: existingSize.id },
              data: { quantity: s.quantity ?? 0 },
            })
          } else {
            await tx.productSize.create({
              data: { productId: id, size: s.size, quantity: s.quantity ?? 0 },
            })
          }
        }
      }

      if (input.variants) {
        await this.replaceVariants(tx, id, input.variants)
      }

      const result = await tx.product.findUnique({
        where: { id },
        include: {
          sizes: { orderBy: { size: 'asc' } },
          variants: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              sizes: { orderBy: { size: 'asc' } },
            },
            orderBy: { sortOrder: 'asc' },
          },
          brand: { select: { id: true, name: true } },
        },
      })
      return serializeProduct(result)
    })
  }

  private async replaceVariants(
    tx: any,
    productId: string,
    variants: NonNullable<UpdateProductInput['variants']>,
  ) {
    const existingVariants = await tx.productVariant.findMany({
      where: { productId },
      include: { sizes: true },
    })
    const incomingIds = new Set(variants.map((variant) => variant.id).filter(Boolean))

    for (const variant of existingVariants) {
      if (!incomingIds.has(variant.id)) {
        const sizeIds = variant.sizes.map((size: { id: string }) => size.id)
        const movementCount = sizeIds.length
          ? await tx.stockMovement.count({ where: { productSizeId: { in: sizeIds } } })
          : 0
        if (movementCount === 0) {
          await tx.productVariant.delete({ where: { id: variant.id } })
        }
      }
    }

    for (const [index, variant] of variants.entries()) {
      const imageUrl = variant.imageUrl ?? variant.images?.[0]?.url ?? null
      const existingVariant = variant.id
        ? existingVariants.find((current: { id: string }) => current.id === variant.id)
        : null
      const savedVariant = existingVariant
        ? await tx.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              colorName: variant.colorName,
              colorHex: variant.colorHex ?? null,
              imageUrl,
              sortOrder: index,
              images: {
                deleteMany: {},
                create: (variant.images ?? [])
                  .filter((image) => image.url)
                  .map((image, imageIndex) => ({ url: image.url, sortOrder: imageIndex })),
              },
            },
          })
        : await tx.productVariant.create({
            data: {
              productId,
              colorName: variant.colorName,
              colorHex: variant.colorHex ?? null,
              imageUrl,
              sortOrder: index,
              images: {
                create: (variant.images ?? [])
                  .filter((image) => image.url)
                  .map((image, imageIndex) => ({ url: image.url, sortOrder: imageIndex })),
              },
            },
          })

      const existingSizes = await tx.productSize.findMany({
        where: { productId, variantId: savedVariant.id },
      })
      const incomingSizes = variant.sizes.map((size) => size.size)

      for (const size of existingSizes.filter((row: { size: string }) => !incomingSizes.includes(row.size))) {
        const movementCount = await tx.stockMovement.count({ where: { productSizeId: size.id } })
        if (movementCount === 0) {
          await tx.productSize.delete({ where: { id: size.id } })
        }
      }

      for (const size of variant.sizes) {
        const existingSize = existingSizes.find((row: { size: string }) => row.size === size.size)
        if (existingSize) {
          await tx.productSize.update({
            where: { id: existingSize.id },
            data: { quantity: size.quantity ?? 0 },
          })
        } else {
          await tx.productSize.create({
            data: {
              productId,
              variantId: savedVariant.id,
              size: size.size,
              quantity: size.quantity ?? 0,
            },
          })
        }
      }
    }
  }

  async delete(id: string, scope: StoreScope) {
    const product = await db.product.findFirst({ where: { id, storeId: scope.storeId, deletedAt: null } })
    if (!product) throw new Error('Product not found')

    return db.$transaction(async (tx) => {
      return tx.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      })
    })
  }

  async getCategories(scope: StoreScope): Promise<string[]> {
    const result = await db.product.groupBy({
      by: ['category'],
      where: { storeId: scope.storeId, category: { not: null }, isActive: true, deletedAt: null },
      orderBy: { category: 'asc' },
    })
    return result.map((r) => r.category!).filter(Boolean)
  }

  async getDashboardStats(scope: StoreScope) {
    const [totalProducts, totalSizes, recentMovements, lowStockCount, inventoryValue] = await Promise.all([
      db.product.count({ where: { storeId: scope.storeId, isActive: true, deletedAt: null } }),
      db.productSize.aggregate({
        _sum: { quantity: true },
        where: { product: { storeId: scope.storeId, isActive: true, deletedAt: null } },
      }),
      db.stockMovement.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          storeId: scope.storeId,
        },
      }),
      // low-stock: product whose total qty across sizes <= product.lowStockThreshold
      db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT p.id, COALESCE(SUM(ps.quantity), 0) AS qty, p."lowStockThreshold" AS threshold
          FROM products p
          LEFT JOIN product_sizes ps ON ps."productId" = p.id
          WHERE p."storeId" = ${scope.storeId} AND p."isActive" = true AND p."deletedAt" IS NULL
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
        WHERE p."storeId" = ${scope.storeId} AND p."isActive" = true AND p."deletedAt" IS NULL
      `,
    ])

    const values = inventoryValue[0]
    const totalUnits = totalSizes._sum.quantity ?? 0

    return {
      totalProducts,
      totalStock: totalUnits,
      totalUnits,
      lowStockCount: Number(lowStockCount[0]?.count ?? 0),
      recentMovements,
      totalInventoryValue: parseFloat(values?.retail_value ?? '0'),
      totalCostValue: parseFloat(values?.cost_value ?? '0'),
      expectedProfit: parseFloat(values?.expected_profit ?? '0'),
    }
  }

  async getOperationalDashboardStats(scope: StoreScope) {
    const [totalProducts, totalSizes, recentMovements, lowStockCount] = await Promise.all([
      db.product.count({ where: { storeId: scope.storeId, isActive: true, deletedAt: null } }),
      db.productSize.aggregate({
        _sum: { quantity: true },
        where: { product: { storeId: scope.storeId, isActive: true, deletedAt: null } },
      }),
      db.stockMovement.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          storeId: scope.storeId,
        },
      }),
      db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT p.id, COALESCE(SUM(ps.quantity), 0) AS qty, p."lowStockThreshold" AS threshold
          FROM products p
          LEFT JOIN product_sizes ps ON ps."productId" = p.id
          WHERE p."storeId" = ${scope.storeId} AND p."isActive" = true AND p."deletedAt" IS NULL
          GROUP BY p.id
        ) agg
        WHERE agg.qty <= agg.threshold
      `,
    ])

    const totalUnits = totalSizes._sum.quantity ?? 0

    return {
      totalProducts,
      totalStock: totalUnits,
      totalUnits,
      lowStockCount: Number(lowStockCount[0]?.count ?? 0),
      recentMovements,
    }
  }
}

export const productsService = new ProductsService()
