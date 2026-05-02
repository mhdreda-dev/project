import { z } from 'zod'

export const createStoreSchema = z.object({
  name: z.string().min(2, 'Store name is required').max(255).trim(),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes')
    .trim(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  admin: z.object({
    name: z.string().min(2, 'Admin name is required').max(255).trim(),
    email: z.string().email('Invalid admin email').max(255).toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  }),
})

export type CreateStoreInput = z.infer<typeof createStoreSchema>
