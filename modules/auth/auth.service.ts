import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { RegisterInput } from '@/lib/validations/auth'
import { Role } from '@prisma/client'

export class AuthService {
  async register(input: RegisterInput, storeId?: string) {
    const existing = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    })

    if (existing) {
      throw new Error('A user with this email already exists')
    }

    const hashed = await bcrypt.hash(input.password, 12)

    const user = await db.user.create({
      data: {
        storeId: storeId ?? null,
        name: input.name.trim(),
        email: input.email.toLowerCase(),
        password: hashed,
        role: (input.role as Role) ?? Role.EMPLOYEE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        storeId: true,
        createdAt: true,
      },
    })

    return user
  }

  async getUserById(id: string) {
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
      },
    })
  }
}

export const authService = new AuthService()
