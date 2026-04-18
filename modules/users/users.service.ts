import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'
import { paginate, paginationMeta } from '@/lib/utils'

interface ListUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: Role
}

interface UpdateUserParams {
  name?: string
  email?: string
  role?: Role
  isActive?: boolean
}

export class UsersService {
  async list({ page = 1, limit = 20, search, role }: ListUsersParams) {
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(role && { role }),
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      db.user.count({ where }),
    ])

    return { users, meta: paginationMeta(total, page, limit) }
  }

  async findById(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async update(id: string, data: UpdateUserParams) {
    if (data.email) {
      const conflict = await db.user.findFirst({
        where: { email: data.email.toLowerCase(), NOT: { id } },
      })
      if (conflict) throw new Error('Email already in use')
    }

    return db.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.email && { email: data.email.toLowerCase() }),
        ...(data.role && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    })
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, password: true },
    })

    if (!user) throw new Error('User not found')

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) throw new Error('Current password is incorrect')

    const hashed = await bcrypt.hash(newPassword, 12)
    await db.user.update({
      where: { id },
      data: { password: hashed },
    })
  }

  async delete(id: string, requesterId: string) {
    if (id === requesterId) throw new Error('Cannot delete your own account')

    return db.user.delete({ where: { id } })
  }
}

export const usersService = new UsersService()
