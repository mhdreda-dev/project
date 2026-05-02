import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SUPER_ADMIN_EMAIL = 'owner@stockmaster.com'
const SUPER_ADMIN_PASSWORD = 'SuperAdmin@123'
const DEFAULT_STORE_ID = 'default-store'

async function main() {
  const store = await prisma.store.findUnique({
    where: { id: DEFAULT_STORE_ID },
    select: { id: true, name: true },
  })

  if (!store) {
    throw new Error(`Default store "${DEFAULT_STORE_ID}" was not found. Run migrations/backfill first.`)
  }

  const existing = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
    select: { id: true, email: true, role: true, storeId: true, isActive: true },
  })

  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: Role.SUPER_ADMIN,
        storeId: existing.storeId ?? DEFAULT_STORE_ID,
        isActive: true,
      },
      select: { id: true, email: true, role: true, storeId: true, isActive: true },
    })

    console.log('SUPER_ADMIN already existed; ensured role/store/active status:', user)
    return
  }

  const password = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12)
  const user = await prisma.user.create({
    data: {
      storeId: DEFAULT_STORE_ID,
      name: 'Platform Owner',
      email: SUPER_ADMIN_EMAIL,
      password,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    select: { id: true, email: true, role: true, storeId: true, isActive: true },
  })

  console.log('Created SUPER_ADMIN:', user)
}

main()
  .catch((error) => {
    console.error('Failed to create SUPER_ADMIN:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
