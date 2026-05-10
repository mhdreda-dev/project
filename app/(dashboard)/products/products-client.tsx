'use client'

import { useState, useCallback } from 'react'
import { SafeImage } from '@/components/ui/safe-image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Plus, Search, Package, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  AlertTriangle, Loader2, Check, ChevronDown, PackageMinus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ImageUpload } from '@/components/ui/image-upload'
import { ProductGridSkeleton } from '@/components/ui/page-skeletons'
import { ExportButton } from '@/components/ui/export-button'
import { DecreaseStockDialog } from '@/components/products/decrease-stock-dialog'
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

type ProductVariant = {
  id: string
  colorName: string
  colorHex: string | null
  imageUrl: string | null
  images: { id: string; url: string }[]
  sizes: ProductSize[]
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
  variants?: ProductVariant[]
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
  canDecreaseStock: boolean
}

type PresetKey = 'clothing' | 'shoes' | 'other'
type ProductCategoryValue = 'shoes' | 'sandals' | 'tshirt' | 'clothing' | 'accessories' | 'other'

const SIZE_PRESETS: Record<PresetKey, { sizes: string[] }> = {
  clothing: { sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  shoes:    { sizes: ['30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'] },
  other:    { sizes: [] },
}

const PRODUCT_CATEGORIES: { value: ProductCategoryValue; label: string }[] = [
  { value: 'shoes', label: 'Shoes / Chaussures' },
  { value: 'sandals', label: 'Sandals / Sandales' },
  { value: 'tshirt', label: 'T-Shirt' },
  { value: 'clothing', label: 'Clothing / Vêtements' },
  { value: 'accessories', label: 'Accessories / Accessoires' },
  { value: 'other', label: 'Other / Autre' },
]

const CATEGORY_ALIASES: Record<string, ProductCategoryValue> = {
  shoes: 'shoes',
  shoe: 'shoes',
  chaussure: 'shoes',
  chaussures: 'shoes',
  sneaker: 'shoes',
  sneakers: 'shoes',
  sandals: 'sandals',
  sandal: 'sandals',
  sandales: 'sandals',
  sandale: 'sandals',
  tshirt: 'tshirt',
  't-shirt': 'tshirt',
  't shirt': 'tshirt',
  tee: 'tshirt',
  clothing: 'clothing',
  clothes: 'clothing',
  vetements: 'clothing',
  vêtements: 'clothing',
  vetement: 'clothing',
  vêtement: 'clothing',
  accessories: 'accessories',
  accessory: 'accessories',
  accessoires: 'accessories',
  accessoire: 'accessories',
  other: 'other',
  autre: 'other',
}

function normalizeCategoryValue(category: string | null | undefined) {
  const normalized = category?.trim().toLowerCase()
  if (!normalized) return ''
  return CATEGORY_ALIASES[normalized] ?? 'other'
}

function hasSize(sizes: { size: string }[], label: string) {
  const normalized = label.trim().toLowerCase()
  return sizes.some((size) => size.size.trim().toLowerCase() === normalized)
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
type VariantForm = {
  clientId: string
  id?: string
  colorName: string
  colorHex: string
  imageUrl: string
  extraImageUrl: string
  images: { url: string }[]
  sizes: SelectedSize[]
  customSize: string
  expanded: boolean
}

function createEmptyVariant(): VariantForm {
  return {
    clientId: crypto.randomUUID(),
    colorName: '',
    colorHex: '#111827',
    imageUrl: '',
    extraImageUrl: '',
    images: [],
    sizes: [],
    customSize: '',
    expanded: true,
  }
}

export function ProductsClient({ initialProducts, meta: initialMeta, brands, isAdmin, canDecreaseStock }: Props) {
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
  const [variants, setVariants] = useState<VariantForm[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saleProduct, setSaleProduct] = useState<Product | null>(null)
  const [saleOpen, setSaleOpen] = useState(false)

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
    setVariants([])
    setModalOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({
      name: product.name,
      sku: product.sku,
      category: normalizeCategoryValue(product.category),
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
    setVariants(
      (product.variants ?? []).map((variant, index) => ({
        clientId: variant.id || crypto.randomUUID(),
        id: variant.id,
        colorName: variant.colorName,
        colorHex: variant.colorHex ?? '#111827',
        imageUrl: variant.imageUrl ?? '',
        extraImageUrl: '',
        images: (variant.images ?? []).map((image) => ({ url: image.url })),
        sizes: variant.sizes.map((s) => ({ size: s.size, quantity: s.quantity })),
        customSize: '',
        expanded: index === 0,
      })),
    )
    setModalOpen(true)
  }

  function openSale(product: Product) {
    setSaleProduct(product)
    setSaleOpen(true)
  }

  function toggleSize(sizeLabel: string) {
    setSelected((prev) => {
      const normalized = sizeLabel.trim().toLowerCase()
      const existing = prev.find((s) => s.size.trim().toLowerCase() === normalized)
      if (existing) return prev.filter((s) => s.size.trim().toLowerCase() !== normalized)
      return [...prev, { size: sizeLabel, quantity: 0 }]
    })
  }

  function updateSelectedQty(sizeLabel: string, qty: number) {
    setSelected((prev) => prev.map((s) => (s.size === sizeLabel ? { ...s, quantity: qty } : s)))
  }

  function addCustomSize() {
    const label = customSize.trim()
    if (!label) return
    if (hasSize(selected, label)) {
      toast({ title: 'Size already selected', variant: 'destructive' })
      setCustomSize('')
      return
    }
    setSelected((prev) => [...prev, { size: label, quantity: 0 }])
    setCustomSize('')
  }

  function removeSelected(sizeLabel: string) {
    setSelected((prev) => prev.filter((s) => s.size !== sizeLabel))
  }

  function addVariant() {
    setVariants((prev) => [...prev.map((variant) => ({ ...variant, expanded: false })), createEmptyVariant()])
  }

  function updateVariant(clientId: string, patch: Partial<VariantForm>) {
    setVariants((prev) => prev.map((variant) => (variant.clientId === clientId ? { ...variant, ...patch } : variant)))
  }

  function removeVariant(clientId: string) {
    setVariants((prev) => prev.filter((variant) => variant.clientId !== clientId))
  }

  function toggleVariantSize(clientId: string, sizeLabel: string) {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.clientId !== clientId) return variant
        const normalized = sizeLabel.trim().toLowerCase()
        const existing = variant.sizes.find((size) => size.size.trim().toLowerCase() === normalized)
        return {
          ...variant,
          sizes: existing
            ? variant.sizes.filter((size) => size.size.trim().toLowerCase() !== normalized)
            : [...variant.sizes, { size: sizeLabel, quantity: 0 }],
        }
      }),
    )
  }

  function updateVariantSizeQty(clientId: string, sizeLabel: string, quantity: number) {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.clientId === clientId
          ? {
              ...variant,
              sizes: variant.sizes.map((size) =>
                size.size === sizeLabel ? { ...size, quantity } : size,
              ),
            }
          : variant,
      ),
    )
  }

  function addVariantCustomSize(clientId: string) {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.clientId !== clientId) return variant
        const label = variant.customSize.trim()
        if (!label) return variant
        if (hasSize(variant.sizes, label)) {
          toast({ title: 'Size already selected for this color', variant: 'destructive' })
          return { ...variant, customSize: '' }
        }
        return {
          ...variant,
          customSize: '',
          sizes: [...variant.sizes, { size: label, quantity: 0 }],
        }
      }),
    )
  }

  function removeVariantSize(clientId: string, sizeLabel: string) {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.clientId === clientId
          ? { ...variant, sizes: variant.sizes.filter((size) => size.size !== sizeLabel) }
          : variant,
      ),
    )
  }

  function addVariantImage(clientId: string) {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.clientId !== clientId) return variant
        const url = variant.extraImageUrl.trim()
        if (!url) return variant
        return {
          ...variant,
          extraImageUrl: '',
          images: [...variant.images, { url }],
          imageUrl: variant.imageUrl || url,
        }
      }),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const priceNum = Number(form.price)
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast({ title: t('products.toast.invalidSalePrice'), variant: 'destructive' })
      return
    }
    if (!PRODUCT_CATEGORIES.some((category) => category.value === form.category)) {
      toast({ title: 'Choose a category', variant: 'destructive' })
      return
    }
    const cleanVariants = variants
      .map((variant) => ({
        id: variant.id,
        colorName: variant.colorName.trim(),
        colorHex: variant.colorHex || null,
        imageUrl: variant.imageUrl || variant.images[0]?.url || null,
        images: [
          ...(variant.imageUrl ? [{ url: variant.imageUrl }] : []),
          ...variant.images.filter((image) => image.url && image.url !== variant.imageUrl),
        ],
        sizes: variant.sizes.map((s) => ({ size: s.size, quantity: Number(s.quantity) || 0 })),
      }))
      .filter((variant) => variant.colorName)

    if (variants.length > 0 && cleanVariants.length !== variants.length) {
      toast({ title: 'Every color variant needs a color name', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        brandId: form.brandId || null,
        category: form.category,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        price: priceNum,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
        isActive: form.isActive,
        sizes: cleanVariants.length
          ? []
          : selected.map((s) => ({ size: s.size, quantity: Number(s.quantity) || 0 })),
        variants: cleanVariants,
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
    <div className="pb-24 sm:pb-28">
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
            {isAdmin && (
              <Button onClick={openCreate} className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" />
                {t('common.actions.addProduct')}
              </Button>
            )}
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
          action={isAdmin ? <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />{t('common.actions.addProduct')}</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const variantSizes = (product.variants ?? []).flatMap((variant) => variant.sizes)
            const displaySizes = variantSizes.length ? variantSizes : product.sizes
            const totalQty = displaySizes.reduce((s, sz) => s + sz.quantity, 0)
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

                  {displaySizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 my-2">
                      {displaySizes.slice(0, 6).map((s, idx) => (
                        <span
                          key={`${s.size}-${idx}`}
                          className="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-slate-50 border-slate-200 text-slate-600"
                        >
                          {s.size}
                        </span>
                      ))}
                      {displaySizes.length > 6 && (
                        <span className="text-[10px] text-slate-400">+{displaySizes.length - 6}</span>
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
                  {canDecreaseStock && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        openSale(product)
                      }}
                      disabled={totalQty <= 0}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <PackageMinus className="h-3.5 w-3.5" />
                      Vente / Diminuer stock
                    </button>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <DecreaseStockDialog
        product={saleProduct}
        open={saleOpen}
        onOpenChange={setSaleOpen}
        onSuccess={() => applyFilters({ page })}
      />

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
        <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[calc(100vw-1.5rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:w-[calc(100vw-2rem)]">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4 pr-12 sm:px-6">
            <DialogTitle>{editing ? t('products.dialog.editTitle') : t('products.dialog.newTitle')}</DialogTitle>
            <p className="text-sm text-slate-500">
              Complete the product details, stock, and optional color variants.
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 px-4 py-4 sm:px-6 sm:py-5">
              <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-950">Product information</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Add the image, identity, category, and customer-facing description.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                      <ImageUpload
                        value={form.imageUrl}
                        onChange={(url) => setForm((f) => ({ ...f, imageUrl: url ?? '' }))}
                        className="[&_.h-48]:h-56 sm:[&_.h-48]:h-64"
                      />
                    </div>

                  {/* Basic info */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">{t('products.dialog.nameRequired')}</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Classic T-Shirt"
                        required
                        className="mt-1 rounded-xl border-slate-200"
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
                        className="mt-1 rounded-xl border-slate-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brand">{t('common.labels.brand')}</Label>
                      <select
                        id="brand"
                        value={form.brandId}
                        onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('common.labels.noBrand')}</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="category">{t('common.labels.category')} *</Label>
                      <Select
                        value={form.category}
                        onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
                      >
                        <SelectTrigger id="category" className="mt-1 rounded-xl border-slate-200">
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                        <SelectContent className="max-sm:z-[9999] max-sm:overflow-hidden max-sm:rounded-xl max-sm:border max-sm:border-slate-200 max-sm:bg-white max-sm:shadow-xl dark:max-sm:border-zinc-800 dark:max-sm:bg-zinc-950">
                          {PRODUCT_CATEGORIES.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                              className="max-sm:bg-white max-sm:data-[highlighted]:bg-slate-100 max-sm:data-[state=checked]:bg-slate-50 dark:max-sm:bg-zinc-950 dark:max-sm:data-[highlighted]:bg-zinc-800 dark:max-sm:data-[state=checked]:bg-zinc-900"
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="description">{t('products.dialog.description')}</Label>
                      <textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder={t('common.placeholders.productDescription')}
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>
                  </div>
                </section>

                {/* Pricing (product-level) */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-950">Pricing and stock rules</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Set selling price and low-stock threshold before configuring sizes.</p>
                  </div>
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
                  className="mt-1 rounded-xl border-slate-200"
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
                    className="mt-1 rounded-xl border-slate-200"
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
                  className="mt-1 rounded-xl border-slate-200"
                />
              </div>
                </div>
                </section>

                {/* Sizes */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Label>{t('products.dialog.sizes')}</Label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Use this for simple products without color-specific stock.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
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
                    const isSelected = hasSize(selected, size)
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

              {/* Custom size input */}
                <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
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
                    className="h-9 rounded-xl border-slate-200 text-sm"
                  />
                  <Button type="button" variant="outline" onClick={addCustomSize} className="rounded-xl h-9">
                    {t('common.actions.add')}
                  </Button>
                </div>

              {/* Selected sizes with quantity */}
              {selected.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  {t('products.dialog.noSizes')}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-white p-2 pr-1">
                  <div className="grid grid-cols-[minmax(0,1fr)_92px_36px] gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-wide px-1 sm:grid-cols-[minmax(0,1fr)_110px_36px]">
                    <span>{t('common.labels.size')}</span>
                    <span>{t('common.labels.quantity')}</span>
                    <span />
                  </div>
                  {selected.map((s) => (
                    <div key={s.size} className="grid grid-cols-[minmax(0,1fr)_92px_36px] gap-2 items-center sm:grid-cols-[minmax(0,1fr)_110px_36px]">
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
              {variants.length > 0 && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Simple sizes are ignored while color variants are enabled. Stock will come from each color card.
                </p>
              )}
                </section>

                {/* Color variants */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Label>Variants / Colors</Label>
                      <p className="mt-1 text-xs text-slate-500">
                        Add colors when one product has separate images and stock per color.
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={addVariant} className="rounded-xl gap-2">
                      <Plus className="h-4 w-4" />
                      Add color variant
                    </Button>
                  </div>

                  {variants.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                      No color variants. This product will use the simple image, sizes, and stock above.
                    </p>
                  ) : (
                    <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                      {variants.map((variant, index) => {
                        const total = variant.sizes.reduce((sum, size) => sum + Number(size.quantity || 0), 0)
                        return (
                          <div key={variant.clientId} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => updateVariant(variant.clientId, { expanded: !variant.expanded })}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <span
                                  className="h-6 w-6 shrink-0 rounded-full border border-slate-200 shadow-sm"
                                  style={{ backgroundColor: variant.colorHex || '#111827' }}
                                  aria-hidden="true"
                                />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-slate-900">
                                    {variant.colorName || `Color variant ${index + 1}`}
                                  </span>
                                  <span className="block text-xs text-slate-500">
                                    {variant.sizes.length} sizes · {total} units
                                  </span>
                                </span>
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="hidden rounded-full bg-white px-2 py-1 text-xs text-slate-500 sm:inline">
                                  {variant.expanded ? 'Collapse' : 'Edit'}
                                </span>
                                <ChevronDown
                                  className={`h-4 w-4 text-slate-400 transition-transform ${variant.expanded ? 'rotate-180' : ''}`}
                                />
                              </span>
                            </button>

                            {variant.expanded && (
                              <div className="space-y-4 border-t border-slate-200 bg-white p-4">
                                <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
                                  <ImageUpload
                                    value={variant.imageUrl}
                                    onChange={(url) => updateVariant(variant.clientId, { imageUrl: url ?? '' })}
                                    className="[&_.h-48]:h-44"
                                  />
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                      <Label>Color name *</Label>
                                      <Input
                                        value={variant.colorName}
                                        onChange={(e) => updateVariant(variant.clientId, { colorName: e.target.value })}
                                        placeholder="Beige"
                                        className="mt-1 rounded-xl border-slate-200"
                                      />
                                    </div>
                                    <div>
                                      <Label>Swatch</Label>
                                      <div className="mt-1 flex gap-2">
                                        <Input
                                          type="color"
                                          value={variant.colorHex}
                                          onChange={(e) => updateVariant(variant.clientId, { colorHex: e.target.value })}
                                          className="h-10 w-14 rounded-xl border-slate-200 p-1"
                                        />
                                        <Input
                                          value={variant.colorHex}
                                          onChange={(e) => updateVariant(variant.clientId, { colorHex: e.target.value })}
                                          placeholder="#111827"
                                          className="rounded-xl border-slate-200"
                                        />
                                      </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <Label>Extra image URL</Label>
                                      <div className="mt-1 flex gap-2">
                                        <Input
                                          value={variant.extraImageUrl}
                                          onChange={(e) => updateVariant(variant.clientId, { extraImageUrl: e.target.value })}
                                          placeholder="https://..."
                                          className="rounded-xl border-slate-200"
                                        />
                                        <Button type="button" variant="outline" onClick={() => addVariantImage(variant.clientId)} className="rounded-xl">
                                          Add
                                        </Button>
                                      </div>
                                      {variant.images.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {variant.images.map((image, imageIndex) => (
                                            <button
                                              key={`${image.url}-${imageIndex}`}
                                              type="button"
                                              onClick={() =>
                                                updateVariant(variant.clientId, {
                                                  images: variant.images.filter((_, idx) => idx !== imageIndex),
                                                })
                                              }
                                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:border-red-200 hover:text-red-600"
                                            >
                                              Image {imageIndex + 1} ×
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <Label>Sizes and stock for this color</Label>
                                    <button
                                      type="button"
                                      onClick={() => removeVariant(variant.clientId)}
                                      className="text-xs font-medium text-red-500 hover:text-red-600"
                                    >
                                      Remove variant
                                    </button>
                                  </div>
                                  <div className="mb-3 flex flex-wrap gap-1.5">
                                    {[...SIZE_PRESETS.clothing.sizes, ...SIZE_PRESETS.shoes.sizes].map((size) => {
                                      const isSelected = hasSize(variant.sizes, size)
                                      return (
                                        <button
                                          key={size}
                                          type="button"
                                          onClick={() => toggleVariantSize(variant.clientId, size)}
                                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                                            isSelected
                                              ? 'border-blue-400 bg-blue-50 text-blue-700'
                                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                          }`}
                                        >
                                          {isSelected && <Check className="h-3 w-3" />}
                                          {size}
                                        </button>
                                      )
                                    })}
                                  </div>
                                  <div className="mb-3 flex gap-2">
                                    <Input
                                      value={variant.customSize}
                                      onChange={(e) => updateVariant(variant.clientId, { customSize: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault()
                                          addVariantCustomSize(variant.clientId)
                                        }
                                      }}
                                      placeholder={t('common.placeholders.customSize')}
                                      className="h-9 rounded-xl border-slate-200 text-sm"
                                    />
                                    <Button type="button" variant="outline" onClick={() => addVariantCustomSize(variant.clientId)} className="h-9 rounded-xl">
                                      {t('common.actions.add')}
                                    </Button>
                                  </div>
                                  {variant.sizes.length === 0 ? (
                                    <p className="text-xs italic text-slate-400">No sizes selected for this color.</p>
                                  ) : (
                                    <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2">
                                      <div className="grid grid-cols-[1fr_100px_32px] gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                        <span>{t('common.labels.size')}</span>
                                        <span>{t('common.labels.quantity')}</span>
                                        <span />
                                      </div>
                                      {variant.sizes.map((size) => (
                                        <div key={size.size} className="grid grid-cols-[1fr_100px_32px] items-center gap-2">
                                          <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                                            {size.size}
                                          </div>
                                          <Input
                                            type="number"
                                            min={0}
                                            value={size.quantity}
                                            onChange={(e) => updateVariantSizeQty(variant.clientId, size.size, Number(e.target.value) || 0)}
                                            className="h-9 rounded-lg text-sm"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeVariantSize(variant.clientId, size.size)}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>

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
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" variant="outline" className="rounded-xl sm:min-w-32" onClick={() => setModalOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl sm:min-w-40">
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
