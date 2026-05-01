import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { stockService } from '@/modules/stock/stock.service'
import { apiError } from '@/lib/utils'
import { toCsv, csvResponse } from '@/lib/csv'
import { MovementType } from '@prisma/client'
import { getRequestI18n } from '@/lib/i18n/request'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError('Unauthorized', 401)
  if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)
  const { t } = getRequestI18n(req)

  const sp = req.nextUrl.searchParams
  const typeParam = sp.get('type')
  const filters = {
    productId: sp.get('productId') || undefined,
    type: (typeParam && ['IN', 'OUT', 'ADJUSTMENT'].includes(typeParam))
      ? (typeParam as MovementType)
      : undefined,
    from: sp.get('from') || undefined,
    to: sp.get('to') || undefined,
  }

  try {
    const movements = await stockService.listAll(filters)
    const typeLabels: Record<MovementType, string> = {
      IN: t('export.values.in'),
      OUT: t('export.values.out'),
      ADJUSTMENT: t('export.values.adjustment'),
    }
    const rows = movements.map((m) => ({
      date: m.createdAt,
      type: typeLabels[m.type],
      product: m.product.name,
      sku: m.product.sku,
      size: m.productSize.size,
      quantity: m.quantity,
      previousQty: m.previousQty,
      newQty: m.newQty,
      reason: m.reason ?? '',
      reference: m.reference ?? '',
      user: m.user.name ?? m.user.email,
    }))

    const csv = toCsv(rows, [
      { key: 'date', header: t('export.headers.date') },
      { key: 'type', header: t('export.headers.type') },
      { key: 'product', header: t('export.headers.product') },
      { key: 'sku', header: t('export.headers.sku') },
      { key: 'size', header: t('export.headers.size') },
      { key: 'quantity', header: t('export.headers.quantity') },
      { key: 'previousQty', header: t('export.headers.previousQty') },
      { key: 'newQty', header: t('export.headers.newQty') },
      { key: 'reason', header: t('export.headers.reason') },
      { key: 'reference', header: t('export.headers.reference') },
      { key: 'user', header: t('export.headers.user') },
    ])

    return csvResponse(csv, 'stock-movements')
  } catch (e) {
    console.error('[stock/export] failed:', e)
    return apiError('Failed to export stock movements', 500)
  }
}
