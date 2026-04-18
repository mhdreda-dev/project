import { z } from 'zod'

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only').optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
})

export const updateBrandSchema = createBrandSchema.partial()

export const brandQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

export type CreateBrandInput = z.infer<typeof createBrandSchema>
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>
export type BrandQuery = z.infer<typeof brandQuerySchema>
