import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'

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
}

export const storesService = new StoresService()
