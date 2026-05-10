'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Loader2, PackageMinus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type ProductSize = {
  id: string
  size: string
  quantity: number
}

type ProductVariant = {
  id: string
  colorName: string
  colorHex: string | null
  sizes: ProductSize[]
}

type ProductForSale = {
  id: string
  name: string
  sku: string
  sizes: ProductSize[]
  variants?: ProductVariant[]
}

type StockOption = ProductSize & {
  label: string
  colorName?: string
  colorHex?: string | null
}

type Props = {
  product: ProductForSale | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
}

export function DecreaseStockDialog({ product, open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast()
  const [productSizeId, setProductSizeId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const stockOptions = useMemo<StockOption[]>(() => {
    if (!product) return []
    const variantOptions = (product.variants ?? []).flatMap((variant) =>
      variant.sizes.map((size) => ({
        ...size,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        label: `${variant.colorName} / ${size.size}`,
      })),
    )
    if (variantOptions.length > 0) return variantOptions
    return product.sizes.map((size) => ({ ...size, label: size.size }))
  }, [product])

  const selectedOption = stockOptions.find((option) => option.id === productSizeId) ?? stockOptions[0]

  function reset(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setProductSizeId('')
      setQuantity('1')
      setNote('')
      setSaving(false)
    }
  }

  async function submitSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product || !selectedOption) return

    const soldQty = Number(quantity)
    if (!Number.isInteger(soldQty) || soldQty <= 0) {
      toast({ title: 'Enter a positive quantity', variant: 'destructive' })
      return
    }
    if (soldQty > selectedOption.quantity) {
      toast({
        title: 'Insufficient stock',
        description: `Available: ${selectedOption.quantity}, requested: ${soldQty}`,
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/products/${product.id}/decrease-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSizeId: selectedOption.id,
          quantity: soldQty,
          note: note.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to decrease stock')

      toast({
        title: 'Stock decreased',
        description: `${soldQty} sold from ${selectedOption.label}.`,
      })
      reset(false)
      await onSuccess()
    } catch (error) {
      toast({
        title: 'Unable to decrease stock',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="w-[calc(100vw-1.5rem)] rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-md">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 text-base">
            <PackageMinus className="h-4 w-4 text-red-600" />
            Vente / Diminuer stock
          </DialogTitle>
          {product && (
            <p className="text-sm text-slate-500">
              {product.name} · SKU {product.sku}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={submitSale} className="space-y-4 px-5 py-5">
          {stockOptions.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              This product has no stock rows to decrease.
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="sale-stock-row">Variant / taille</Label>
                <select
                  id="sale-stock-row"
                  value={productSizeId || selectedOption?.id || ''}
                  onChange={(event) => setProductSizeId(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {stockOptions.map((option) => (
                    <option key={option.id} value={option.id} disabled={option.quantity === 0}>
                      {option.label} - {option.quantity} available
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-slate-600">
                    {selectedOption?.colorName && (
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-slate-200"
                        style={{ backgroundColor: selectedOption.colorHex ?? '#111827' }}
                      />
                    )}
                    <span className="truncate">{selectedOption?.label ?? 'No size selected'}</span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-semibold',
                      (selectedOption?.quantity ?? 0) <= 0 ? 'text-red-600' : 'text-slate-800',
                    )}
                  >
                    {selectedOption?.quantity ?? 0} available
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="sale-qty">Quantité vendue</Label>
                <Input
                  id="sale-qty"
                  type="number"
                  min={1}
                  max={selectedOption?.quantity ?? undefined}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                  className="mt-1 rounded-xl border-slate-200"
                />
              </div>

              <div>
                <Label htmlFor="sale-note">
                  Note <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <textarea
                  id="sale-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value.slice(0, 500))}
                  placeholder="sold in store"
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </>
          )}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => reset(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl"
              disabled={saving || stockOptions.length === 0 || !selectedOption || selectedOption.quantity === 0}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
