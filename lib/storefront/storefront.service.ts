import { db } from '@/lib/db'

// ─── Public-safe field selectors ─────────────────────────────────────────────
// These selects intentionally omit costPrice and all internal-only fields.

const PUBLIC_PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  sku: true,
  category: true,
  imageUrl: true,
  price: true,
  lowStockThreshold: true,
  sizes: {
    select: { size: true, quantity: true },
    orderBy: { size: 'asc' as const },
  },
  variants: {
    select: {
      id: true,
      colorName: true,
      colorHex: true,
      imageUrl: true,
      images: {
        select: { url: true },
        orderBy: { sortOrder: 'asc' as const },
      },
      sizes: {
        select: { size: true, quantity: true },
        orderBy: { size: 'asc' as const },
      },
    },
    orderBy: { sortOrder: 'asc' as const },
  },
  brand: { select: { id: true, name: true, slug: true } },
} as const

// Serialize Prisma Decimal → number so results are serializable by Server Components.
function toNum(v: unknown): number {
  return v == null ? 0 : Number(v)
}

function serializeProduct<T extends Record<string, any>>(p: T) {
  const variantSizes = Array.isArray(p.variants)
    ? (p.variants as { sizes?: { quantity: number }[] }[]).flatMap((variant) => variant.sizes ?? [])
    : []
  const stockRows = variantSizes.length ? variantSizes : Array.isArray(p.sizes) ? (p.sizes as { quantity: number }[]) : []
  const totalStock = stockRows.reduce((s, r) => s + r.quantity, 0)
  return { ...p, price: toNum(p.price), totalStock }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export async function getPublicStore(slug: string) {
  return db.store.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, phone: true, address: true },
  })
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface PublicProductQuery {
  category?: string
  search?: string
  page?: number
  limit?: number
}

export async function getPublicProducts(storeId: string, opts: PublicProductQuery = {}) {
  const { category, search, page = 1, limit = 24 } = opts
  const skip = (page - 1) * limit

  const where = {
    storeId,
    isActive: true,
    deletedAt: null,
    ...(category && { category: { equals: category, mode: 'insensitive' as const } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      select: PUBLIC_PRODUCT_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ])

  return {
    products: rows.map(serializeProduct),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getPublicProduct(storeId: string, productId: string) {
  const p = await db.product.findFirst({
    where: { id: productId, storeId, isActive: true, deletedAt: null },
    select: PUBLIC_PRODUCT_SELECT,
  })
  return p ? serializeProduct(p) : null
}

export async function getPublicCategories(storeId: string): Promise<string[]> {
  const rows = await db.product.groupBy({
    by: ['category'],
    where: { storeId, isActive: true, deletedAt: null, category: { not: null } },
    orderBy: { category: 'asc' },
  })
  return rows.map((r) => r.category!).filter(Boolean)
}
