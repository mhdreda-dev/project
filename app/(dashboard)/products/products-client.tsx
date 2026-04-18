'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Package, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  AlertTriangle, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

type Brand = { id: string; name: string }

type ProductSize = {
  id: string
  size: string
  quantity: number
  minQuantity: number
  maxQuantity: number | null
  price: number
  costPrice: number | null
}

type Product = {
  id: string
  name: string
  sku: string
  category: string | null
  description: string | null
  imageUrl: string | null
  isActive: boolean
  brandId: string | null
  brand: { id: string; name: string } | null
  sizes: ProductSize[]
  _count: { movements: number }
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface Props {
  initialProducts: Product[]
  meta: PaginationMeta
  brands: Brand[]
  isAdmin: boolean
}

type SizePreset = { label: string; sizes: string[] }

const SIZE_PRESETS: Record<string, SizePreset> = {
  clothing: { label: 'Clothing', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
  shoes: { label: 'Shoes', sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] },
  other: { label: 'Other', sizes: [] },
}

const DEFAULT_FORM = {
  name: '',
  sku: '',
  category: '',
  description: '',
  imageUrl: '',
  brandId: '',
  isActive: true,
}

type SizeRow = { size: string; quantity: number; minQuantity: number; maxQuantity: number; price: number; costPrice: number }

function emptySize(size = ''): SizeRow {
  return { size, quantity: 0, minQuantity: 5, maxQuantity: 0, price: 0, costPrice: 0 }
}

export function ProductsClient({ initialProducts, meta: initialMeta, brands, isAdmin }: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const [products, setProducts] = useState(initialProducts)
  const [meta, setMeta] = useState(initialMeta)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [fetching, setFetching] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [sizes, setSizes] = useState<SizeRow[]>([emptySize()])
  const [productType, setProductType] = useState('other')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchProducts = useCallback(async (params: {
    search?: string; brandId?: string; isActive?: string; page?: number
  }) => {
    setFetching(true)
    try {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.brandId) q.set('brandId', params.brandId)
      if (params.isActive !== undefined && params.isActive !== '') q.set('isActive', params.isActive)
      if (params.page) q.set('page', String(params.page))
      q.set('limit', '12')
      const res = await fetch(`/api/products?${q}`)
      const json = await res.json()
      if (json.data) {
        setProducts(json.data.products)
        setMeta(json.data.meta)
      }
    } finally {
      setFetching(false)
    }
  }, [])

  function applyFilters(overrides: { search?: string; brandId?: string; isActive?: string; page?: number } = {}) {
    const params = {
      search: overrides.search ?? search,
      brandId: overrides.brandId ?? brandFilter,
      isActive: overrides.isActive ?? statusFilter,
      page: overrides.page ?? 1,
    }
    setPage(params.page)
    fetchProducts(params)
  }

  function clearFilters() {
    setSearch('')
    setBrandFilter('')
    setStatusFilter('')
    setPage(1)
    fetchProducts({})
  }

  function openCreate() {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setSizes([emptySize()])
    setProductType('other')
    setModalOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category ?? '',
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      brandId: product.brandId ?? '',
      isActive: product.isActive,
    })
    setSizes(
      product.sizes.length > 0
        ? product.sizes.map((s) => ({
            size: s.size,
            quantity: s.quantity,
            minQuantity: s.minQuantity,
            maxQuantity: s.maxQuantity ?? 0,
            price: Number(s.price),
            costPrice: Number(s.costPrice ?? 0),
          }))
        : [emptySize()],
    )
    setProductType('other')
    setModalOpen(true)
  }

  function applyPreset(type: string) {
    setProductType(type)
    const preset = SIZE_PRESETS[type]
    if (preset && preset.sizes.length > 0) {
      setSizes(preset.sizes.map((s) => emptySize(s)))
    }
  }

  function updateSize(i: number, field: keyof SizeRow, value: string | number) {
    setSizes((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  function addSize() {
    setSizes((prev) => [...prev, emptySize()])
  }

  function removeSize(i: number) {
    setSizes((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sizes.length === 0 || sizes.some((s) => !s.size.trim())) {
      toast({ title: 'Please fill in all size names', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        brandId: form.brandId || null,
        category: form.category || undefined,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        sizes: sizes.map((s) => ({
          size: s.size,
          quantity: Number(s.quantity),
          minQuantity: Number(s.minQuantity),
          maxQuantity: Number(s.maxQuantity) || undefined,
          price: Number(s.price),
          costPrice: Number(s.costPrice) || undefined,
        })),
      }
      const url = editing ? `/api/products/${editing.id}` : '/api/products'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: editing ? 'Product updated' : 'Product created' })
      setModalOpen(false)
      applyFilters()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Something went wrong', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setDeleting(product.id)
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: 'Product deleted' })
      applyFilters()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Cannot delete', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const hasFilters = search || brandFilter || statusFilter

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${meta.total} products in your catalog`}
        action={
          isAdmin && (
            <Button onClick={openCreate} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search: e.currentTarget.value })}
            className="pl-9 rounded-xl border-slate-200"
          />
        </div>

        <select
          value={brandFilter}
          onChange={(e) => { setBrandFilter(e.target.value); applyFilters({ brandId: e.target.value }) }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); applyFilters({ isActive: e.target.value }) }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-slate-500 h-10 rounded-xl">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Grid */}
      {fetching ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={hasFilters ? 'Try adjusting your filters' : 'Add your first product to get started'}
          action={isAdmin && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Product</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const totalQty = product.sizes.reduce((s, sz) => s + sz.quantity, 0)
            const isLow = product.sizes.some((s) => s.quantity <= s.minQuantity)
            const avgPrice = product.sizes.length > 0
              ? product.sizes.reduce((s, sz) => s + Number(sz.price), 0) / product.sizes.length
              : 0

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                {/* Image */}
                <div className="relative h-40 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-slate-200" />
                  )}
                  {!product.isActive && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    </div>
                  )}
                  {isLow && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0 gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Low Stock
                      </Badge>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="h-7 w-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="h-7 w-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-red-600 shadow-sm"
                        onClick={() => handleDelete(product)}
                        disabled={deleting === product.id}
                      >
                        {deleting === product.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="mb-1">
                    {product.brand && (
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-0.5">{product.brand.name}</p>
                    )}
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">SKU: {product.sku}</p>
                  </div>

                  <div className="flex flex-wrap gap-1 my-2">
                    {product.sizes.slice(0, 5).map((s) => (
                      <span
                        key={s.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                          s.quantity <= s.minQuantity
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {s.size}
                      </span>
                    ))}
                    {product.sizes.length > 5 && (
                      <span className="text-[10px] text-slate-400">+{product.sizes.length - 5}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-xs text-slate-400">Total stock</p>
                      <p className={`text-sm font-semibold ${isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                        {totalQty} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Avg. price</p>
                      <p className="text-sm font-semibold text-slate-800">{formatCurrency(avgPrice)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500">
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!meta.hasPrev || fetching}
              onClick={() => { const p = page - 1; setPage(p); applyFilters({ page: p }) }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!meta.hasNext || fetching}
              onClick={() => { const p = page + 1; setPage(p); applyFilters({ page: p }) }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image */}
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url ?? '' }))}
            />

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Classic T-Shirt"
                  required
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="TS-001"
                  required
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <select
                  id="brand"
                  value={form.brandId}
                  onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Clothing, Shoes..."
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Product description..."
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Sizes & Stock *</Label>
                {!editing && (
                  <div className="flex gap-1.5">
                    {Object.entries(SIZE_PRESETS).map(([key, p]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyPreset(key)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          productType === key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <div className="grid grid-cols-7 gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wide px-1 mb-1">
                  <span className="col-span-1">Size</span>
                  <span>Qty</span>
                  <span>Min</span>
                  <span>Max</span>
                  <span>Price</span>
                  <span>Cost</span>
                  <span />
                </div>
                {sizes.map((s, i) => (
                  <div key={i} className="grid grid-cols-7 gap-1.5 items-center">
                    <Input
                      value={s.size}
                      onChange={(e) => updateSize(i, 'size', e.target.value)}
                      placeholder="M"
                      required
                      className="rounded-lg text-xs h-8 col-span-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={s.quantity}
                      onChange={(e) => updateSize(i, 'quantity', e.target.value)}
                      className="rounded-lg text-xs h-8"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={s.minQuantity}
                      onChange={(e) => updateSize(i, 'minQuantity', e.target.value)}
                      className="rounded-lg text-xs h-8"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={s.maxQuantity}
                      onChange={(e) => updateSize(i, 'maxQuantity', e.target.value)}
                      className="rounded-lg text-xs h-8"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={s.price}
                      onChange={(e) => updateSize(i, 'price', e.target.value)}
                      required
                      className="rounded-lg text-xs h-8"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={s.costPrice}
                      onChange={(e) => updateSize(i, 'costPrice', e.target.value)}
                      className="rounded-lg text-xs h-8"
                    />
                    <button
                      type="button"
                      onClick={() => removeSize(i)}
                      disabled={sizes.length === 1}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSize}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add size
              </button>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span className="text-sm text-slate-700">Active (visible in catalog)</span>
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
