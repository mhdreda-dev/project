'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Package, Edit, Trash2, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import type { Product, ProductSize } from '@prisma/client'

type ProductWithSizes = Product & { sizes: ProductSize[]; _count: { movements: number } }

interface PaginationMeta {
  total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean
}

interface Props {
  products: ProductWithSizes[]
  meta: PaginationMeta
  categories: string[]
  isAdmin: boolean
  initialSearch?: string
  initialCategory?: string
}

export function ProductsClient({ products, meta, categories, isAdmin, initialSearch, initialCategory }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch ?? '')
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [viewProduct, setViewProduct] = useState<ProductWithSizes | null>(null)

  function applySearch() {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    router.push(`/products?${params}`)
  }

  async function deleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: 'Product deleted', variant: 'default' })
      router.refresh()
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">{meta.total} products total</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={applySearch}>Search</Button>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No products found.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const totalQty = product.sizes.reduce((s, sz) => s + sz.quantity, 0)
            const isLow = product.sizes.some((s) => s.quantity <= s.minQuantity)

            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">SKU: {product.sku}</p>
                    </div>
                    <div className="flex gap-1">
                      {product.category && (
                        <Badge variant="outline" className="text-xs shrink-0">{product.category}</Badge>
                      )}
                      {!product.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total stock</span>
                    <span className={`font-semibold ${isLow ? 'text-orange-600' : 'text-green-600'}`}>
                      {totalQty} units {isLow && '⚠'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.sizes.slice(0, 4).map((s) => (
                      <span
                        key={s.id}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${
                          s.quantity <= s.minQuantity
                            ? 'bg-orange-50 border-orange-200 text-orange-700'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {s.size}: {s.quantity}
                      </span>
                    ))}
                    {product.sizes.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{product.sizes.length - 4} more</span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setViewProduct(product)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/products/${product.id}/edit`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleting === product.id}
                          onClick={() => deleteProduct(product.id)}
                        >
                          {deleting === product.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrev}
              onClick={() => router.push(`/products?page=${meta.page - 1}`)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => router.push(`/products?page=${meta.page + 1}`)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      {isAdmin && (
        <CreateProductDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); router.refresh() }}
        />
      )}

      {/* View Dialog */}
      {viewProduct && (
        <ViewProductDialog
          product={viewProduct}
          onClose={() => setViewProduct(null)}
        />
      )}
    </div>
  )
}

// ─── Create Product Dialog ────────────────────────────────────

function CreateProductDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [sizes, setSizes] = useState([{ size: '', quantity: 0, price: 0, minQuantity: 0 }])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const payload = {
      name: form.get('name'),
      sku: form.get('sku'),
      category: form.get('category') || undefined,
      description: form.get('description') || undefined,
      sizes: sizes.map((s) => ({
        size: s.size,
        quantity: Number(s.quantity),
        price: Number(s.price),
        minQuantity: Number(s.minQuantity),
      })),
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: 'Product created!', variant: 'default' })
      onSuccess()
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  function addSize() {
    setSizes([...sizes, { size: '', quantity: 0, price: 0, minQuantity: 0 }])
  }

  function updateSize(i: number, field: string, value: string | number) {
    const updated = [...sizes]
    updated[i] = { ...updated[i], [field]: value }
    setSizes(updated)
  }

  function removeSize(i: number) {
    setSizes(sizes.filter((_, idx) => idx !== i))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Product Name *</Label>
              <Input name="name" placeholder="Classic T-Shirt" required />
            </div>
            <div className="space-y-1">
              <Label>SKU *</Label>
              <Input name="sku" placeholder="TS-001" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <Input name="category" placeholder="Clothing" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input name="description" placeholder="Product description..." />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sizes & Stock *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSize}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Size
              </Button>
            </div>
            {sizes.map((size, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Size</Label>
                  <Input
                    placeholder="M"
                    value={size.size}
                    onChange={(e) => updateSize(i, 'size', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={0}
                    value={size.quantity}
                    onChange={(e) => updateSize(i, 'quantity', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={size.price}
                    onChange={(e) => updateSize(i, 'price', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min Qty</Label>
                  <Input
                    type="number"
                    min={0}
                    value={size.minQuantity}
                    onChange={(e) => updateSize(i, 'minQuantity', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  disabled={sizes.length === 1}
                  onClick={() => removeSize(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── View Product Dialog ──────────────────────────────────────

function ViewProductDialog({ product, onClose }: { product: ProductWithSizes; onClose: () => void }) {
  const totalValue = product.sizes.reduce((s, sz) => s + sz.quantity * Number(sz.price), 0)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">SKU:</span> <span className="font-medium">{product.sku}</span></div>
            <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{product.category ?? '—'}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <Badge variant={product.isActive ? 'success' : 'secondary'}>{product.isActive ? 'Active' : 'Inactive'}</Badge></div>
            <div><span className="text-muted-foreground">Total Value:</span> <span className="font-semibold text-green-700">{formatCurrency(totalValue)}</span></div>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Sizes & Stock</p>
            <div className="space-y-2">
              {product.sizes.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">Size {s.size}</span>
                    {s.quantity <= s.minQuantity && (
                      <Badge variant="warning" className="text-xs">Low</Badge>
                    )}
                  </div>
                  <div className="text-sm text-right">
                    <span className="font-semibold">{s.quantity}</span>
                    <span className="text-muted-foreground"> / {s.minQuantity} min</span>
                    <span className="text-muted-foreground ml-2">{formatCurrency(Number(s.price))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
