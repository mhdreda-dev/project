import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('store')?.trim().toLowerCase()
  if (!slug) return apiSuccess({ store: null })
  if (!/^[a-z0-9-]+$/.test(slug)) return apiError('Invalid store slug', 422)

  const store = await db.store.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, isActive: true },
  })

  if (!store || !store.isActive) return apiError('Store not found or inactive', 404)

  return apiSuccess({ store: { name: store.name, slug: store.slug } })
}
