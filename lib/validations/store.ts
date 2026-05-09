import { z } from 'zod'

// Slugs that would collide with system routes — blocked at creation time.
const RESERVED_SLUGS = new Set([
  'api', 'dashboard', 'login', 'register', 'admin',
  'brands', 'products', 'stock', 'users', 'reports',
  'logs', 'stores', 'ai-requests', '_next',
])

export const createStoreSchema = z.object({
  name: z.string().min(2, 'Store name is required').max(255).trim(),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes')
    .trim()
    .refine((s) => !RESERVED_SLUGS.has(s), { message: 'This slug is reserved and cannot be used' }),
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

const optionalUrl = z
  .string()
  .trim()
  .url('Enter a valid URL')
  .optional()
  .nullable()
  .or(z.literal(''))

export const updateStoreSettingsSchema = z.object({
  name: z.string().min(2, 'Store name is required').max(255).trim(),
  phone: z.string().max(50).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  logoUrl: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  shortDescription: z.string().max(500).optional().nullable(),
  heroImageUrl: optionalUrl,
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Accent color must be a hex color')
    .optional()
    .nullable()
    .or(z.literal('')),
})

export type CreateStoreInput = z.infer<typeof createStoreSchema>
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>
