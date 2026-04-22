import { auth } from '@/lib/auth'
import { brandsService } from '@/modules/brands/brands.service'
import { BrandsClient } from './brands-client'
import { getServerI18n } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export default async function BrandsPage() {
  const session = await auth()
  const { t } = getServerI18n()

  let brands: any[] = []
  let loadError: string | null = null
  try {
    const result = await brandsService.list({ page: 1, limit: 100 })
    brands = result.brands ?? []
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load brands'
    console.error('[BrandsPage] load error:', e)
  }

  if (loadError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">{t('brands.unavailableTitle')}</h1>
        <p className="text-sm text-slate-600">
          {t('brands.unavailableDescription')}
        </p>
        <pre className="mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto">
          {loadError}
        </pre>
      </div>
    )
  }

  return <BrandsClient initialBrands={brands as any} isAdmin={session?.user?.role === 'ADMIN'} />
}
