'use client'

import { FormEvent, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, PackageMinus } from 'lucide-react'
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
      <DialogContent className="flex max-h-[90vh] w-full max-w-[92vw] flex-col overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4 pr-12 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <PackageMinus className="h-5 w-5" />
            </span>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-base font-semibold leading-6 text-slate-950 sm:text-lg">
                Vente / Diminuer stock
              </DialogTitle>
              {product && (
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {product.name} · SKU {product.sku}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submitSale} className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          {stockOptions.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              This product has no stock rows to decrease.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sale-stock-row" className="text-sm font-medium text-slate-700">Variant / taille</Label>
                <select
                  id="sale-stock-row"
                  value={productSizeId || selectedOption?.id || ''}
                  onChange={(event) => setProductSizeId(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {stockOptions.map((option) => (
                    <option key={option.id} value={option.id} disabled={option.quantity === 0}>
                      {option.label} - {option.quantity} available
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {selectedOption?.colorName && (
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-slate-200 shadow-sm"
                        style={{ backgroundColor: selectedOption.colorHex ?? '#111827' }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {selectedOption?.label ?? 'No size selected'}
                      </p>
                      <p className="text-xs text-slate-500">Taille / couleur sélectionnée</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1 text-xs font-bold',
                      (selectedOption?.quantity ?? 0) <= 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700',
                    )}
                  >
                    {selectedOption?.quantity ?? 0} disponible(s)
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="sale-qty" className="text-sm font-medium text-slate-700">Quantité vendue</Label>
                <Input
                  id="sale-qty"
                  type="number"
                  min={1}
                  max={selectedOption?.quantity ?? undefined}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                  className="mt-1.5 h-11 rounded-xl border-slate-200 bg-white text-base font-semibold text-slate-950 shadow-sm focus-visible:ring-blue-500 sm:h-12"
                />
              </div>

              <div>
                <Label htmlFor="sale-note" className="text-sm font-medium text-slate-700">
                  Note optionnelle
                </Label>
                <textarea
                  id="sale-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value.slice(0, 500))}
                  placeholder="sold in store"
                  rows={2}
                  className="mt-1.5 max-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:rows-3 sm:max-h-32"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>This action will decrease stock immediately.</span>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="h-11 rounded-xl border-slate-200 sm:px-5" onClick={() => reset(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-emerald-600 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:w-auto sm:px-6"
              disabled={saving || stockOptions.length === 0 || !selectedOption || selectedOption.quantity === 0}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer la vente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
