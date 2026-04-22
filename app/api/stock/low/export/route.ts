import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { stockService } from '@/modules/stock/stock.service'
import { apiError } from '@/lib/utils'
import { toCsv, csvResponse } from '@/lib/csv'
import { getRequestI18n } from '@/lib/i18n/request'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  const { t } = getRequestI18n(req)

  try {
    const items = await stockService.getLowStock()
    const rows = items.map((it) => ({
      sku: it.product.sku,
      name: it.product.name,
      category: it.product.category ?? '',
      size: it.size,
      quantity: it.quantity,
      threshold: it.minQuantity,
      status: it.quantity === 0 ? t('export.values.outOfStock') : t('export.values.low'),
    }))

    const csv = toCsv(rows, [
      { key: 'sku', header: t('export.headers.sku') },
      { key: 'name', header: t('export.headers.product') },
      { key: 'category', header: t('export.headers.category') },
      { key: 'size', header: t('export.headers.size') },
      { key: 'quantity', header: t('export.headers.quantity') },
      { key: 'threshold', header: t('export.headers.threshold') },
      { key: 'status', header: t('export.headers.status') },
    ])

    return csvResponse(csv, 'low-stock')
  } catch (e) {
    console.error('[stock/low/export] failed:', e)
    return apiError('Failed to export low-stock report', 500)
  }
}
