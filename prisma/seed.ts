import { PrismaClient, Role, MovementType, ActivityAction } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Users ───────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const employeePassword = await bcrypt.hash('Employee@123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@stockmaster.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@stockmaster.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  })

  const employee = await prisma.user.upsert({
    where: { email: 'employee@stockmaster.com' },
    update: {},
    create: {
      name: 'John Employee',
      email: 'employee@stockmaster.com',
      password: employeePassword,
      role: Role.EMPLOYEE,
    },
  })

  console.log('✅ Users created:', admin.email, employee.email)

  // ─── Products ────────────────────────────────────────────
  const products = [
    {
      name: 'Classic T-Shirt',
      sku: 'TS-001',
      category: 'Clothing',
      description: 'High-quality cotton t-shirt',
      sizes: [
        { size: 'XS', quantity: 50, price: 19.99, costPrice: 8.00, minQuantity: 10 },
        { size: 'S',  quantity: 80, price: 19.99, costPrice: 8.00, minQuantity: 15 },
        { size: 'M',  quantity: 120, price: 19.99, costPrice: 8.00, minQuantity: 20 },
        { size: 'L',  quantity: 100, price: 19.99, costPrice: 8.00, minQuantity: 20 },
        { size: 'XL', quantity: 60, price: 22.99, costPrice: 9.00, minQuantity: 10 },
      ],
    },
    {
      name: 'Slim Fit Jeans',
      sku: 'JN-002',
      category: 'Clothing',
      description: 'Modern slim fit denim jeans',
      sizes: [
        { size: '28', quantity: 30, price: 59.99, costPrice: 25.00, minQuantity: 5 },
        { size: '30', quantity: 45, price: 59.99, costPrice: 25.00, minQuantity: 8 },
        { size: '32', quantity: 55, price: 59.99, costPrice: 25.00, minQuantity: 10 },
        { size: '34', quantity: 40, price: 59.99, costPrice: 25.00, minQuantity: 8 },
        { size: '36', quantity: 20, price: 64.99, costPrice: 27.00, minQuantity: 5 },
      ],
    },
    {
      name: 'Running Sneakers',
      sku: 'SN-003',
      category: 'Footwear',
      description: 'Lightweight running shoes',
      sizes: [
        { size: '38', quantity: 15, price: 89.99, costPrice: 40.00, minQuantity: 3 },
        { size: '40', quantity: 25, price: 89.99, costPrice: 40.00, minQuantity: 5 },
        { size: '42', quantity: 30, price: 89.99, costPrice: 40.00, minQuantity: 5 },
        { size: '44', quantity: 20, price: 89.99, costPrice: 40.00, minQuantity: 3 },
        { size: '46', quantity: 8,  price: 94.99, costPrice: 43.00, minQuantity: 2 },
      ],
    },
    {
      name: 'Leather Belt',
      sku: 'BL-004',
      category: 'Accessories',
      description: 'Genuine leather belt',
      sizes: [
        { size: 'S/M', quantity: 40, price: 29.99, costPrice: 12.00, minQuantity: 8 },
        { size: 'L/XL', quantity: 35, price: 34.99, costPrice: 14.00, minQuantity: 8 },
      ],
    },
    {
      name: 'Wool Sweater',
      sku: 'SW-005',
      category: 'Clothing',
      description: 'Premium merino wool sweater',
      sizes: [
        { size: 'S',  quantity: 5, price: 79.99, costPrice: 35.00, minQuantity: 8 },
        { size: 'M',  quantity: 18, price: 79.99, costPrice: 35.00, minQuantity: 10 },
        { size: 'L',  quantity: 22, price: 79.99, costPrice: 35.00, minQuantity: 10 },
        { size: 'XL', quantity: 3, price: 84.99, costPrice: 37.00, minQuantity: 5 },
      ],
    },
  ]

  for (const productData of products) {
    const { sizes, ...productFields } = productData

    const product = await prisma.product.upsert({
      where: { sku: productFields.sku },
      update: {},
      create: {
        ...productFields,
        sizes: {
          create: sizes,
        },
      },
    })

    // Create initial stock-in movements
    const createdSizes = await prisma.productSize.findMany({
      where: { productId: product.id },
    })

    for (const size of createdSizes) {
      if (size.quantity > 0) {
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            productSizeId: size.id,
            userId: admin.id,
            type: MovementType.IN,
            quantity: size.quantity,
            previousQty: 0,
            newQty: size.quantity,
            reason: 'Initial stock',
            reference: 'SEED-001',
          },
        })
      }
    }

    console.log(`✅ Product created: ${product.name}`)
  }

  // ─── Activity Logs ────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        action: ActivityAction.LOGIN,
        entity: 'auth',
        ipAddress: '127.0.0.1',
        metadata: { note: 'seed initial login' },
      },
      {
        userId: admin.id,
        action: ActivityAction.CREATE,
        entity: 'product',
        metadata: { note: 'seed products created' },
      },
    ],
  })

  console.log('✅ Activity logs seeded')
  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 Credentials:')
  console.log('  Admin:    admin@stockmaster.com    / Admin@123')
  console.log('  Employee: employee@stockmaster.com / Employee@123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
