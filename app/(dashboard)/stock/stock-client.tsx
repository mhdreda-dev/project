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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Movements</h1>
          <p className="text-muted-foreground mt-1">{meta.total} total movements</p>
        </div>
        <Button onClick={() => setShowRecord(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Movement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movement History</CardTitle>
          <CardDescription>All stock in, out, and adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-8">No stock movements yet.</p>
          ) : (
            <div className="space-y-0 divide-y">
              {movements.map((m) => (
                <div key={m.id} className="py-3 flex items-center gap-4">
                  <div className="shrink-0">{typeIcon[m.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {m.product.name} — Size {m.productSize.size}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.user.name} · {m.reason ?? 'No reason'} {m.reference && `· Ref: ${m.reference}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <Badge variant={typeBadge[m.type]}>
                      {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '='}
                      {m.quantity} units
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
          <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={() => router.push(`/stock?page=${meta.page - 1}`)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => router.push(`/stock?page=${meta.page + 1}`)}>Next</Button>
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

  const product = products.find((p) => p.id === selectedProduct)
  const sizes = product?.sizes ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSize) { toast({ title: 'Select a size', variant: 'destructive' }); return }

    setLoading(true)
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSizeId: selectedSize, type, quantity, reason: reason || undefined, reference: reference || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: 'Movement recorded!', variant: 'default' })
      onSuccess()
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Product *</Label>
            <Select value={selectedProduct} onValueChange={(v) => { setSelectedProduct(v); setSelectedSize('') }}>
              <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="space-y-1">
              <Label>Size *</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger><SelectValue placeholder="Select size..." /></SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.size} — {s.quantity} in stock
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Stock In (add)</SelectItem>
                <SelectItem value="OUT">Stock Out (remove)</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment (set absolute)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Quantity *</Label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Reason</Label>
              <Input placeholder="Sale, restock..." value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Reference</Label>
              <Input placeholder="PO-001..." value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
