'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { useI18n } from '@/components/i18n-provider'

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

interface Movement {
  id: string
  type: MovementType
  quantity: number
  previousQty: number
  newQty: number
  reason: string | null
  reference: string | null
  createdAt: Date
  product: { name: string; sku: string }
  productSize: { size: string }
  user: { name: string; email: string }
}

interface ProductWithSizes {
  id: string
  name: string
  sku: string
  sizes: { id: string; size: string; quantity: number; minQuantity: number }[]
}

interface PaginationMeta {
  total: number; page: number; totalPages: number; hasNext: boolean; hasPrev: boolean
}

interface Props {
  movements: Movement[]
  meta: PaginationMeta
  products: ProductWithSizes[]
  isAdmin: boolean
}

const typeIcon = {
  IN: <ArrowUpCircle className="h-4 w-4 text-green-500" />,
  OUT: <ArrowDownCircle className="h-4 w-4 text-red-500" />,
  ADJUSTMENT: <TrendingUp className="h-4 w-4 text-blue-500" />,
}

const typeBadge: Record<MovementType, 'success' | 'destructive' | 'info'> = {
  IN: 'success',
  OUT: 'destructive',
  ADJUSTMENT: 'info',
}

export function StockClient({ movements, meta, products, isAdmin }: Props) {
  const router = useRouter()
  const [showRecord, setShowRecord] = useState(false)
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('stock.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('stock.description', { count: meta.total })}</p>
        </div>
        <Button onClick={() => setShowRecord(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('common.actions.recordMovement')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('stock.historyTitle')}</CardTitle>
          <CardDescription>{t('stock.historyDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-8">{t('stock.empty')}</p>
          ) : (
            <div className="space-y-0 divide-y">
              {movements.map((m) => (
                <div key={m.id} className="py-3 flex items-center gap-4">
                  <div className="shrink-0">{typeIcon[m.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {t('dashboard.recent.size', { product: m.product.name, size: m.productSize.size })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.user.name} · {m.reason ?? t('common.status.noReason')}
                      {m.reference && <> · {t('common.labels.reference')}: {m.reference}</>}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <Badge variant={typeBadge[m.type]}>
                      {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '='}
                      {t('common.misc.units', { count: m.quantity })}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {m.previousQty} → {m.newQty}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 hidden sm:block w-32 text-right">
                    {formatDate(m.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('common.misc.pageOf', { page: meta.page, total: meta.totalPages })}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={() => router.push(`/stock?page=${meta.page - 1}`)}>{t('common.actions.previous')}</Button>
            <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => router.push(`/stock?page=${meta.page + 1}`)}>{t('common.actions.next')}</Button>
          </div>
        </div>
      )}

      <RecordMovementDialog
        open={showRecord}
        products={products}
        onClose={() => setShowRecord(false)}
        onSuccess={() => { setShowRecord(false); router.refresh() }}
      />
    </div>
  )
}

function RecordMovementDialog({
  open, products, onClose, onSuccess
}: {
  open: boolean
  products: ProductWithSizes[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [type, setType] = useState<MovementType>('IN')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')
  const { t } = useI18n()

  const product = products.find((p) => p.id === selectedProduct)
  const sizes = product?.sizes ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSize) { toast({ title: t('stock.toast.selectSize'), variant: 'destructive' }); return }

    setLoading(true)
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSizeId: selectedSize, type, quantity, reason: reason || undefined, reference: reference || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: t('stock.toast.recorded'), variant: 'default' })
      onSuccess()
    } catch (e) {
      toast({ title: t('stock.toast.error'), description: (e as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('stock.recordDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>{t('common.labels.product')} *</Label>
            <Select value={selectedProduct} onValueChange={(v) => { setSelectedProduct(v); setSelectedSize('') }}>
              <SelectTrigger><SelectValue placeholder={t('common.placeholders.selectProduct')} /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="space-y-1">
              <Label>{t('common.labels.size')} *</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger><SelectValue placeholder={t('common.placeholders.selectSize')} /></SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {t('stock.recordDialog.inStock', { size: s.size, count: s.quantity })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>{t('common.labels.type')} *</Label>
            <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">{t('stock.recordDialog.stockInAdd')}</SelectItem>
                <SelectItem value="OUT">{t('stock.recordDialog.stockOutRemove')}</SelectItem>
                <SelectItem value="ADJUSTMENT">{t('stock.recordDialog.adjustSet')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t('common.labels.quantity')} *</Label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('common.labels.reason')}</Label>
              <Input placeholder={t('common.placeholders.reasonExample')} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('common.labels.reference')}</Label>
              <Input placeholder={t('common.placeholders.referenceExample')} value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('common.actions.cancel')}</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.actions.record')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
