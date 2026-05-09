import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'
import { UpdateStoreSettingsInput } from '@/lib/validations/store'

export interface CreateStoreInput {
  name: string
  slug: string
  phone?: string | null
  address?: string | null
  isActive?: boolean
  admin: {
    name: string
    email: string
    password: string
  }
}

export class StoresService {
  async list() {
    return db.store.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, products: true } },
        users: {
          where: { role: Role.ADMIN },
          select: { id: true, name: true, email: true, isActive: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    })
  }

  async create(input: CreateStoreInput) {
    const slug = input.slug.toLowerCase().trim()
    const email = input.admin.email.toLowerCase().trim()

    const [existingStore, existingUser] = await Promise.all([
      db.store.findUnique({ where: { slug } }),
      db.user.findUnique({ where: { email } }),
    ])
    if (existingStore) throw new Error(`Store slug "${slug}" already exists`)
    if (existingUser) throw new Error('A user with this email already exists')

    const hashed = await bcrypt.hash(input.admin.password, 12)

    return db.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: input.name.trim(),
          slug,
          phone: input.phone?.trim() || null,
          address: input.address?.trim() || null,
          isActive: input.isActive ?? true,
        },
      })

      const admin = await tx.user.create({
        data: {
          storeId: store.id,
          name: input.admin.name.trim(),
          email,
          password: hashed,
          role: Role.ADMIN,
          isActive: true,
        },
        select: { id: true, name: true, email: true, role: true, storeId: true },
      })

      return { store, admin }
    })
  }

  async findSettings(storeId: string) {
    return db.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        whatsapp: true,
        address: true,
        logoUrl: true,
        instagramUrl: true,
        facebookUrl: true,
        shortDescription: true,
        heroImageUrl: true,
        primaryColor: true,
        isActive: true,
      },
    })
  }

  async updateSettings(storeId: string, input: UpdateStoreSettingsInput) {
    return db.store.update({
      where: { id: storeId },
      data: {
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        whatsapp: input.whatsapp?.trim() || null,
        address: input.address?.trim() || null,
        logoUrl: input.logoUrl?.trim() || null,
        instagramUrl: input.instagramUrl?.trim() || null,
        facebookUrl: input.facebookUrl?.trim() || null,
        shortDescription: input.shortDescription?.trim() || null,
        heroImageUrl: input.heroImageUrl?.trim() || null,
        primaryColor: input.primaryColor?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        whatsapp: true,
        address: true,
        logoUrl: true,
        instagramUrl: true,
        facebookUrl: true,
        shortDescription: true,
        heroImageUrl: true,
        primaryColor: true,
        isActive: true,
      },
    })
  }
}

export const storesService = new StoresService()
