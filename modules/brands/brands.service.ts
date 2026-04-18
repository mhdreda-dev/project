import { db } from '@/lib/db'
import { paginate, paginationMeta } from '@/lib/utils'
import { CreateBrandInput, UpdateBrandInput, BrandQuery } from '@/lib/validations/brand'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export class BrandsService {
  async list(query: BrandQuery) {
    const { page, limit, search, isActive } = query

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    }

    const [brands, total] = await Promise.all([
      db.brand.findMany({
        where,
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
        ...paginate(page, limit),
      }),
      db.brand.count({ where }),
    ])

    return { brands, meta: paginationMeta(total, page, limit) }
  }

  async listAll() {
    return db.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string) {
    return db.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
        products: {
          take: 10,
          select: { id: true, name: true, sku: true, imageUrl: true, isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    })
  }

  async create(input: CreateBrandInput) {
    const slug = input.slug || toSlug(input.name)

    const [existingName, existingSlug] = await Promise.all([
      db.brand.findFirst({ where: { name: { equals: input.name, mode: 'insensitive' } } }),
      db.brand.findUnique({ where: { slug } }),
    ])
    if (existingName) throw new Error(`Brand "${input.name}" already exists`)
    if (existingSlug) throw new Error(`Slug "${slug}" already in use`)

    return db.brand.create({
      data: {
        name: input.name,
        slug,
        logoUrl: input.logoUrl || null,
        description: input.description || null,
        isActive: input.isActive ?? true,
      },
    })
  }

  async update(id: string, input: UpdateBrandInput) {
    const brand = await db.brand.findUnique({ where: { id } })
    if (!brand) throw new Error('Brand not found')

    const slug = input.slug ?? (input.name ? toSlug(input.name) : undefined)

    if (input.name && input.name !== brand.name) {
      const conflict = await db.brand.findFirst({
        where: { name: { equals: input.name, mode: 'insensitive' }, NOT: { id } },
      })
      if (conflict) throw new Error(`Brand "${input.name}" already exists`)
    }

    return db.brand.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(slug && { slug }),
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl || null }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      include: { _count: { select: { products: true } } },
    })
  }

  async delete(id: string) {
    const brand = await db.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!brand) throw new Error('Brand not found')
    if (brand._count.products > 0)
      throw new Error(`Cannot delete brand with ${brand._count.products} products. Reassign them first.`)

    await db.brand.delete({ where: { id } })
  }
}

export const brandsService = new BrandsService()
