import { z } from 'zod'

export const stockMovementSchema = z.object({
  productSizeId: z.string().min(1, 'Product size is required'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT'], {
    required_error: 'Movement type is required',
  }),
  quantity: z.number().int().positive('Quantity must be positive'),
  reason: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
})

export const stockQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  productId: z.string().optional(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export type StockMovementInput = z.infer<typeof stockMovementSchema>
export type StockQuery = z.infer<typeof stockQuerySchema>
