'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { SafeImage } from '@/components/ui/safe-image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Plus, Search, Package, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  AlertTriangle, Loader2, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ImageUpload } from '@/components/ui/image-upload'
import { ProductGridSkeleton } from '@/components/ui/page-skeletons'
import { ExportButton } from '@/components/ui/export-button'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { useI18n } from '@/components/i18n-provider'

type Brand = { id: string; name: string }

type ProductSize = {
  id: string
  size: string
  quantity: number
}

type Product = {
  id: string
  name: string
  sku: string
  category: string | null
  description: string | null
  imageUrl: string | null
  price: number | string
  costPrice: number | string | null
  lowStockThreshold: number
  isActive: boolean
  brandId: string | null
  brand: { id: string; name: string } | null
  sizes: ProductSize[]
  _count?: { movements: number }
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

type PresetKey = 'clothing' | 'shoes' | 'other'

const SIZE_PRESETS: Record<PresetKey, { sizes: string[] }> = {
  clothing: { sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  shoes:    { sizes: ['38', '39', '40', '41', '42', '43', '44', '45'] },
  other:    { sizes: [] },
}

const DEFAULT_FORM = {
  name: '',
  sku: '',
  category: '',
  description: '',
  imageUrl: '',
  brandId: '',
  price: '',
  costPrice: '',
  lowStockThreshold: '5',
  isActive: true,
}

type SelectedSize = { size: string; quantity: number }

export function ProductsClient({ initialProducts, meta: initialMeta, brands, isAdmin }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const urlSearchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useI18n()

  const [products, setProducts] = useState(initialProducts)
  const [meta, setMeta] = useState(initialMeta)
  // Initial state hydrated from the URL so refresh + share links preserve filters.
  const [search, setSearch] = useState(urlSearchParams.get('search') ?? '')
  const [brandFilter, setBrandFilter] = useState(urlSearchParams.get('brandId') ?? '')
  const [statusFilter, setStatusFilter] = useState(urlSearchParams.get('isActive') ?? '')
  const [page, setPage] = useState(Number(urlSearchParams.get('page') ?? 1))
  const [fetching, setFetching] = useState(false)

  /** Sync current filter state → URL (shallow replace, no scroll). */
  const syncUrl = useCallback((next: { search?: string; brandId?: string; isActive?: string; page?: number }) => {
    const params = new URLSearchParams()
    if (next.search) params.set('search', next.search)
    if (next.brandId) params.set('brandId', next.brandId)
    if (next.isActive) params.set('isActive', next.isActive)
    if (next.page && next.page > 1) params.set('page', String(next.page))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [pathname, router])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [preset, setPreset] = useState<PresetKey>('other')
  const [selected, setSelected] = useState<SelectedSize[]>([])
  const [customSize, setCustomSize] = useState('')
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
    setPreset('other')
    setSelected([])
    setCustomSize('')
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
      price: String(product.price ?? ''),
      costPrice: product.costPrice != null ? String(product.costPrice) : '',
      lowStockThreshold: String(product.lowStockThreshold ?? 5),
      isActive: product.isActive,
    })
    // Infer preset from sizes
    const sizes = product.sizes.map((s) => s.size)
    const inClothing = sizes.every((s) => SIZE_PRESETS.clothing.sizes.includes(s)) && sizes.length > 0
    const inShoes = sizes.every((s) => SIZE_PRESETS.shoes.sizes.includes(s)) && sizes.length > 0
    setPreset(inClothing ? 'clothing' : inShoes ? 'shoes' : 'other')
    setSelected(product.sizes.map((s) => ({ size: s.size, quantity: s.quantity })))
    setCustomSize('')
    setModalOpen(true)
  }

  function toggleSize(sizeLabel: string) {
    setSelected((prev) => {
      const existing = prev.find((s) => s.size === sizeLabel)
      if (existing) return prev.filter((s) => s.size !== sizeLabel)
      return [...prev, { size: sizeLabel, quantity: 0 }]
    })
  }

  function updateSelectedQty(sizeLabel: string, qty: number) {
    setSelected((prev) => prev.map((s) => (s.size === sizeLabel ? { ...s, quantity: qty } : s)))
  }

  function addCustomSize() {
    const label = customSize.trim()
    if (!label) return
    if (selected.some((s) => s.size === label)) {
      setCustomSize('')
      return
    }
    setSelected((prev) => [...prev, { size: label, quantity: 0 }])
    setCustomSize('')
  }

  function removeSelected(sizeLabel: string) {
    setSelected((prev) => prev.filter((s) => s.size !== sizeLabel))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const priceNum = Number(form.price)
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast({ title: t('products.toast.invalidSalePrice'), variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        brandId: form.brandId || null,
        category: form.category || null,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        price: priceNum,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
        isActive: form.isActive,
        sizes: selected.map((s) => ({ size: s.size, quantity: Number(s.quantity) || 0 })),
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
      toast({ title: editing ? t('products.toast.updated') : t('products.toast.created') })
      setModalOpen(false)
      applyFilters()
    } catch (e) {
      toast({ title: t('common.errorTitle'), description: e instanceof Error ? e.message : t('products.toast.error'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(t('products.confirmArchive', { name: product.name }))) return
    setDeleting(product.id)
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t('products.toast.cannotArchive'))
      toast({ title: t('products.toast.archived') })
      applyFilters()
    } catch {
      toast({ title: t('common.errorTitle'), description: t('products.toast.cannotArchive'), variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const hasFilters = search || brandFilter || statusFilter
  const presetSizes = SIZE_PRESETS[preset].sizes
  const customSelected = selected.filter((s) => !presetSizes.includes(s.size))

  return (
    <div>
      <PageHeader
        title={t('products.title')}
        description={t('products.description', { count: meta.total })}
        action={
          <div className="flex gap-2">
            {isAdmin && (
              <ExportButton
                endpoint="/api/products/export"
                filename="products"
                params={{ search, brandId: brandFilter, isActive: statusFilter }}
                disabled={meta.total === 0}
              />
            )}
            <Button onClick={openCreate} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              {t('common.actions.addProduct')}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('common.placeholders.searchProducts')}
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
          <option value="">{t('products.filters.allBrands')}</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); applyFilters({ isActive: e.target.value }) }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('products.filters.allStatuses')}</option>
          <option value="true">{t('common.status.active')}</option>
          <option value="false">{t('common.status.inactive')}</option>
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-slate-500 h-10 rounded-xl">
            <X className="h-3.5 w-3.5" />
            {t('common.actions.clear')}
          </Button>
        )}
      </div>

      {/* Grid */}
      {fetching ? (
        <ProductGridSkeleton count={8} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('products.empty.title')}
          description={hasFilters ? t('products.empty.filtered') : t('products.empty.initial')}
          action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />{t('common.actions.addProduct')}</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const totalQty = product.sizes.reduce((s, sz) => s + sz.quantity, 0)
            const isLow = totalQty <= (product.lowStockThreshold ?? 0)
            const priceNum = Number(product.price ?? 0)

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group block focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="relative h-40 bg-slate-50 flex items-center justify-center overflow-hidden">
                  <SafeImage
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                  {!product.isActive && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                      <Badge variant="secondary" className="text-xs">{t('products.card.inactive')}</Badge>
                    </div>
                  )}
                  {isLow && product.isActive && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0 gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {t('common.status.lowStock')}
                      </Badge>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="h-7 w-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(product) }}
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="h-7 w-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-red-600 shadow-sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(product) }}
                        disabled={deleting === product.id}
                        aria-label={`Archive ${product.name}`}
                      >
                        {deleting === product.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-1">
                    {product.brand && (
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-0.5">{product.brand.name}</p>
                    )}
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{t('common.labels.skuValue', { sku: product.sku })}</p>
                  </div>

                  {product.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 my-2">
                      {product.sizes.slice(0, 6).map((s) => (
                        <span
                          key={s.id}
                          className="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-slate-50 border-slate-200 text-slate-600"
                        >
                          {s.size}
                        </span>
                      ))}
                      {product.sizes.length > 6 && (
                        <span className="text-[10px] text-slate-400">+{product.sizes.length - 6}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-xs text-slate-400">{t('common.labels.stock')}</p>
                      <p className={`text-sm font-semibold ${isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                        {t('common.misc.units', { count: totalQty })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{t('common.labels.priceMad')}</p>
                      <p className="text-sm font-semibold text-slate-800">{formatCurrency(priceNum)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500">
            {t('common.misc.pageOfTotal', { page: meta.page, total: meta.totalPages, count: meta.total })}
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
            <DialogTitle>{editing ? t('products.dialog.editTitle') : t('products.dialog.newTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url ?? '' }))}
            />

            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('products.dialog.nameRequired')}</Label>
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
                <Label htmlFor="sku">{t('products.dialog.skuRequired')}</Label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">{t('common.labels.brand')}</Label>
                <select
                  id="brand"
                  value={form.brandId}
                  onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('common.labels.noBrand')}</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="category">{t('common.labels.category')}</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder={t('common.placeholders.categoryExample')}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">{t('products.dialog.description')}</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('common.placeholders.productDescription')}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Pricing (product-level) */}
            <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              <div>
                <Label htmlFor="price">{t('common.labels.salePriceMad')} *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder={t('common.placeholders.priceMad')}
                  required
                  className="mt-1 rounded-xl"
                />
              </div>
              {isAdmin && (
                <div>
                  <Label htmlFor="costPrice">{t('common.labels.costPriceMad')}</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.costPrice}
                    onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                    placeholder={t('common.placeholders.priceMad')}
                    className="mt-1 rounded-xl"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="lowStock">{t('common.labels.lowStockThreshold')}</Label>
                <Input
                  id="lowStock"
                  type="number"
                  min={0}
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t('products.dialog.sizes')}</Label>
                <div className="flex gap-1.5">
                  {(Object.keys(SIZE_PRESETS) as PresetKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPreset(key)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        preset === key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t(`products.dialog.presets.${key}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset chips (multi-select) */}
              {presetSizes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {presetSizes.map((size) => {
                    const isSelected = selected.some((s) => s.size === size)
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {size}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Custom size input (always visible for "Other") */}
              {preset === 'other' && (
                <div className="flex gap-2 mb-3">
                  <Input
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomSize()
                      }
                    }}
                    placeholder={t('common.placeholders.customSize')}
                    className="rounded-xl h-9 text-sm"
                  />
                  <Button type="button" variant="outline" onClick={addCustomSize} className="rounded-xl h-9">
                    {t('common.actions.add')}
                  </Button>
                </div>
              )}

              {/* Selected sizes with quantity */}
              {selected.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  {t('products.dialog.noSizes')}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  <div className="grid grid-cols-[1fr_100px_32px] gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-wide px-1">
                    <span>{t('common.labels.size')}</span>
                    <span>{t('common.labels.quantity')}</span>
                    <span />
                  </div>
                  {selected.map((s) => (
                    <div key={s.size} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
                      <div className="h-9 rounded-lg bg-slate-50 border border-slate-200 px-3 flex items-center text-sm font-medium text-slate-700">
                        {s.size}
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={s.quantity}
                        onChange={(e) => updateSelectedQty(s.size, Number(e.target.value) || 0)}
                        className="rounded-lg text-sm h-9"
                      />
                      <button
                        type="button"
                        onClick={() => removeSelected(s.size)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Show custom entries also under clothing/shoes presets */}
              {preset !== 'other' && customSelected.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  {t('products.dialog.includesCustomSizes', { count: customSelected.length })}
                </p>
              )}
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span className="text-sm text-slate-700">{t('products.dialog.activeVisible')}</span>
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setModalOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? t('common.actions.saveChanges') : t('common.actions.createProduct')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
