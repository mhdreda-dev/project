import { z } from 'zod'

export const productSizeSchema = z.object({
  size: z.string().min(1, 'Size is required').max(50),
  quantity: z.number().int().min(0).default(0),
})

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255).trim(),
  description: z.string().max(2000).optional().nullable(),
  sku: z.string().min(1, 'SKU is required').max(100).trim(),
  category: z.string().max(100).optional().nullable(),
  brandId: z.string().optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  price: z.number().nonnegative('Price cannot be negative'),
  costPrice: z.number().nonnegative().optional().nullable(),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  isActive: z.boolean().optional(),
  sizes: z.array(productSizeSchema).default([]),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
  sku: z.string().min(1).max(100).trim().optional(),
  category: z.string().max(100).optional().nullable(),
  brandId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  price: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional().nullable(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  sizes: z.array(productSizeSchema).optional(),
})

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  brandId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductQuery = z.infer<typeof productQuerySchema>
