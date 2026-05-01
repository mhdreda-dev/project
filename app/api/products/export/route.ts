import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
import { apiError, formatCurrency } from '@/lib/utils'
import { toCsv, csvResponse } from '@/lib/csv'
import { getRequestI18n } from '@/lib/i18n/request'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)
  const { t } = getRequestI18n(req)

  const sp = req.nextUrl.searchParams
  const isActiveParam = sp.get('isActive')
  const filters = {
    search: sp.get('search') || undefined,
    category: sp.get('category') || undefined,
    brandId: sp.get('brandId') || undefined,
    isActive: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
  }

  try {
    const products = await productsService.listAll(filters)

    const rows = products.map((p: any) => {
      const totalStock = (p.sizes ?? []).reduce((s: number, sz: any) => s + (sz.quantity ?? 0), 0)
      const sizes = (p.sizes ?? [])
        .map((sz: any) => `${sz.size}:${sz.quantity}`)
        .join(' | ')
      return {
        sku: p.sku,
        name: p.name,
        brand: p.brand?.name ?? '',
        category: p.category ?? '',
        price: formatCurrency(p.price ?? 0),
        costPrice: p.costPrice != null ? formatCurrency(p.costPrice) : '',
        lowStockThreshold: p.lowStockThreshold,
        totalStock,
        sizes,
        isActive: p.isActive ? t('export.values.yes') : t('export.values.no'),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }
    })

    const csv = toCsv(rows, [
      { key: 'sku', header: t('export.headers.sku') },
      { key: 'name', header: t('export.headers.name') },
      { key: 'brand', header: t('export.headers.brand') },
      { key: 'category', header: t('export.headers.category') },
      { key: 'price', header: t('export.headers.priceMad') },
      { key: 'costPrice', header: t('export.headers.costPriceMad') },
      { key: 'lowStockThreshold', header: t('export.headers.lowStockThreshold') },
      { key: 'totalStock', header: t('export.headers.totalStock') },
      { key: 'sizes', header: t('export.headers.sizesSizeQty') },
      { key: 'isActive', header: t('export.headers.active') },
      { key: 'createdAt', header: t('export.headers.createdAt') },
      { key: 'updatedAt', header: t('export.headers.updatedAt') },
    ])

    return csvResponse(csv, 'products')
  } catch (e) {
    console.error('[products/export] failed:', e)
    return apiError('Failed to export products', 500)
  }
}
