'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Package, ArrowUpCircle, ArrowDownCircle, TrendingUp, AlertTriangle,
  Loader2, DollarSign, Layers, ChevronRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SafeImage } from '@/components/ui/safe-image'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useI18n } from '@/components/i18n-provider'

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

type ProductSize = { id: string; size: string; quantity: number }
type Movement = {
  id: string
  type: MovementType
  quantity: number
  previousQty: number
  newQty: number
  reason: string | null
  reference: string | null
  createdAt: string | Date
  user: { name: string | null; email: string }
}
type Product = {
  id: string
  name: string
  sku: string
  description: string | null
  category: string | null
  imageUrl: string | null
  price: number
  costPrice?: number | null
  lowStockThreshold: number
  isActive: boolean
  brand: { id: string; name: string } | null
  sizes: ProductSize[]
  movements: Movement[]
}

interface Props {
  product: Product
  isAdmin: boolean
}

type ChartPoint = { date: string; in_qty: number; out_qty: number }

export function ProductDetailClient({ product: initial, isAdmin }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useI18n()
  const [product, setProduct] = useState(initial)
  const [chart, setChart] = useState<ChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustSize, setAdjustSize] = useState<ProductSize | null>(null)
  const [adjustType, setAdjustType] = useState<MovementType>('IN')
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustRef, setAdjustRef] = useState('')
  const [saving, setSaving] = useState(false)

  const totalStock = product.sizes.reduce((s, sz) => s + sz.quantity, 0)
  const isLow = totalStock <= product.lowStockThreshold
  const margin = isAdmin && product.costPrice != null
    ? Number(product.price) - Number(product.costPrice)
    : null
  const marginPct = margin != null && Number(product.price) > 0
    ? (margin / Number(product.price)) * 100
    : null
  const inventoryValue = totalStock * Number(product.price)
  const getMovementLabel = (type: MovementType) => {
    if (type === 'IN') return t('common.actions.in')
    if (type === 'OUT') return t('common.actions.out')
    return t('common.actions.set')
  }

  const fetchChart = useCallback(async () => {
    setChartLoading(true)
    try {
      const res = await fetch(`/api/stock/chart?days=30&productId=${product.id}`)
      const json = await res.json()
      if (json.success) setChart(json.data)
    } finally {
      setChartLoading(false)
    }
  }, [product.id])

  useEffect(() => {
    fetchChart()
  }, [fetchChart])

  async function reloadProduct() {
    // Re-fetch detail to pick up new size quantities + movement log after an adjust.
    try {
      const res = await fetch(`/api/products/${product.id}`)
      const json = await res.json()
      if (json.success && json.data) setProduct(json.data as Product)
    } catch {
      /* non-fatal */
    }
  }

  function openAdjust(size: ProductSize, type: MovementType = 'IN') {
    setAdjustSize(size)
    setAdjustType(type)
    setAdjustQty('')
    setAdjustReason('')
    setAdjustRef('')
    setAdjustOpen(true)
  }

  async function submitAdjust(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustSize) return
    const qty = Number(adjustQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      toast({ title: t('productDetail.enterPositiveQuantity'), variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSizeId: adjustSize.id,
          type: adjustType,
          quantity: qty,
          reason: adjustReason || undefined,
          reference: adjustRef || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? t('productDetail.failedToSave'))
      toast({
        title: t('productDetail.stockUpdated'),
        description: t('productDetail.stockUpdatedDescription', {
          type: getMovementLabel(adjustType),
          qty,
          size: adjustSize.size,
        }),
      })
      setAdjustOpen(false)
      await Promise.all([reloadProduct(), fetchChart()])
      router.refresh()
    } catch (e) {
      toast({
        title: t('common.errorTitle'),
        description: e instanceof Error ? e.message : t('products.toast.error'),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const typeStyle: Record<MovementType, { icon: typeof ArrowUpCircle; color: string; bg: string }> = {
    IN: { icon: ArrowUpCircle, color: 'text-green-600', bg: 'bg-green-50' },
    OUT: { icon: ArrowDownCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ADJUSTMENT: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/products" className="flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('productDetail.breadcrumbProducts')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-700 font-medium truncate">{product.name}</span>
      </nav>

      {/* Header card: image + summary */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="relative h-64 lg:h-72 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
          <SafeImage
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 320px"
            className="object-cover"
          />
          {!product.isActive && (
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
              <Badge variant="secondary">{t('common.status.inactive')}</Badge>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            {product.brand && (
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{product.brand.name}</p>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{product.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{t('common.labels.sku')}: <span className="text-slate-700 font-medium">{product.sku}</span></span>
              {product.category && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{product.category}</span>
                </>
              )}
              {isLow && product.isActive && (
                <>
                  <span className="text-slate-300">·</span>
                  <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {t('common.status.lowStock')}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {product.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label={t('common.labels.priceMad')} value={formatCurrency(Number(product.price))} icon={DollarSign} />
            {isAdmin ? (
              <>
                <MiniStat
                  label={t('common.labels.costPriceMad')}
                  value={product.costPrice != null ? formatCurrency(Number(product.costPrice)) : '—'}
                />
                <MiniStat
                  label={t('common.labels.marginMad')}
                  value={margin != null
                    ? `${formatCurrency(margin)}${marginPct != null ? ` (${marginPct.toFixed(0)}%)` : ''}`
                    : '—'}
                />
                <MiniStat label={t('common.labels.inventoryValueMad')} value={formatCurrency(inventoryValue)} />
              </>
            ) : (
              <MiniStat label={t('common.labels.stock')} value={t('common.misc.units', { count: totalStock })} />
            )}
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="outline" className="rounded-xl gap-2">
                <Link href={`/products?edit=${product.id}`}>{t('common.actions.editProduct')}</Link>
              </Button>
              {product.sizes[0] && (
                <Button
                  onClick={() => openAdjust(product.sizes[0], 'IN')}
                  className="rounded-xl gap-2"
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  {t('productDetail.quickStockIn')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stock by size */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-400" />
              {t('productDetail.stockBySize')}
            </CardTitle>
            <CardDescription>
              {t('common.misc.variantCount', { count: product.sizes.length })} · {t('common.misc.totalUnitCount', { count: totalStock })} ·
              {t('common.labels.threshold')} {product.lowStockThreshold}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {product.sizes.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4">{t('productDetail.noSizeVariants')}</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {product.sizes.map((s) => {
                const sizeLow = s.quantity <= product.lowStockThreshold
                return (
                  <div key={s.id} className="py-3 flex items-center gap-4">
                    <div className="h-10 w-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700">
                      {s.size}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${sizeLow ? 'text-amber-700' : 'text-slate-800'}`}>
                        {t('common.misc.unitCount', { count: s.quantity })}
                      </p>
                      {sizeLow && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {t('productDetail.atOrBelowThreshold')}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg gap-1 h-8"
                          onClick={() => openAdjust(s, 'IN')}
                        >
                          <ArrowUpCircle className="h-3.5 w-3.5 text-green-600" />
                          {t('common.actions.in')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg gap-1 h-8"
                          onClick={() => openAdjust(s, 'OUT')}
                          disabled={s.quantity === 0}
                        >
                          <ArrowDownCircle className="h-3.5 w-3.5 text-red-600" />
                          {t('common.actions.out')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg gap-1 h-8"
                          onClick={() => openAdjust(s, 'ADJUSTMENT')}
                        >
                          <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                          {t('common.actions.set')}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('productDetail.movementHistoryTitle')}</CardTitle>
          <CardDescription>{t('productDetail.movementHistoryDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              {t('productDetail.loadingChart')}
            </div>
          ) : chart.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              {t('productDetail.noMovementLast30')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`in-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`out-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="in_qty" name={t('reports.stats.stockIn')} stroke="#3b82f6" strokeWidth={2} fill={`url(#in-${product.id})`} />
                <Area type="monotone" dataKey="out_qty" name={t('reports.stats.stockOut')} stroke="#ef4444" strokeWidth={2} fill={`url(#out-${product.id})`} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent movements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('productDetail.recentMovementsTitle')}</CardTitle>
          <CardDescription>{t('productDetail.recentMovementsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {product.movements.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4">{t('productDetail.noMovements')}</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {product.movements.map((m) => {
                const style = typeStyle[m.type]
                const Icon = style.icon
                return (
                  <div key={m.id} className="py-3 flex items-center gap-4">
                    <div className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {m.type === 'OUT' ? '-' : m.type === 'IN' ? '+' : '='}
                        {t('common.misc.unitCount', { count: m.quantity })}
                        <span className="text-slate-400 font-normal ml-2">
                          {m.previousQty} → {m.newQty}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {m.reason ?? <span className="italic text-slate-400">{t('common.status.noReason')}</span>}
                        {m.reference && <> · {t('common.labels.reference')}: {m.reference}</>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">{formatDate(m.createdAt)}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[140px]">
                        {t('common.misc.byUser', { name: m.user.name ?? m.user.email })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {adjustType === 'IN' && t('productDetail.stockInTitle')}
              {adjustType === 'OUT' && t('productDetail.stockOutTitle')}
              {adjustType === 'ADJUSTMENT' && t('productDetail.adjustStockTitle')}
              {adjustSize && <span className="text-slate-400 font-normal"> · {t('common.labels.size')} {adjustSize.size}</span>}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitAdjust} className="space-y-4">
            <div className="flex gap-2">
              {(['IN', 'OUT', 'ADJUSTMENT'] as MovementType[]).map((movementType) => (
                <button
                  key={movementType}
                  type="button"
                  onClick={() => setAdjustType(movementType)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    adjustType === movementType
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {getMovementLabel(movementType)}
                </button>
              ))}
            </div>

            <div>
              <Label htmlFor="adjust-qty">
                {adjustType === 'ADJUSTMENT' ? t('productDetail.setQuantityTo') : t('common.labels.quantity')}
              </Label>
              <Input
                id="adjust-qty"
                type="number"
                min={adjustType === 'ADJUSTMENT' ? 0 : 1}
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder={adjustType === 'ADJUSTMENT'
                  ? t('common.labels.currentCount', { count: adjustSize?.quantity ?? 0 })
                  : '0'}
                required
                className="mt-1 rounded-xl"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="adjust-reason">{t('common.labels.reason')} <span className="text-slate-400 font-normal">({t('common.labels.optional')})</span></Label>
              <Input
                id="adjust-reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder={t('productDetail.reasonPlaceholder')}
                className="mt-1 rounded-xl"
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="adjust-ref">{t('common.labels.reference')} <span className="text-slate-400 font-normal">({t('common.labels.optional')})</span></Label>
              <Input
                id="adjust-ref"
                value={adjustRef}
                onChange={(e) => setAdjustRef(e.target.value)}
                placeholder={t('productDetail.referencePlaceholder')}
                className="mt-1 rounded-xl"
                maxLength={100}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setAdjustOpen(false)}
              >
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('common.actions.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MiniStat({
  label, value, icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof Package
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{label}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-300" />}
        <span className="text-sm font-semibold text-slate-800 truncate">{value}</span>
      </div>
    </div>
  )
}
