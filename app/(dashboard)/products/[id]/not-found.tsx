import Link from 'next/link'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getServerI18n } from '@/lib/i18n/server'

export default function ProductNotFound() {
  const { t } = getServerI18n()

  return (
    <div className="py-20 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
        <Package className="h-8 w-8 text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{t('productDetail.notFoundTitle')}</h1>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
        {t('productDetail.notFoundDescription')}
      </p>
      <Button asChild className="mt-6 rounded-xl">
        <Link href="/products">{t('common.actions.backToProducts')}</Link>
      </Button>
    </div>
  )
}
