'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Search, Pencil, Trash2, Tag, Package, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

type Brand = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  _count: { products: number }
}

interface BrandsClientProps {
  initialBrands: Brand[]
  isAdmin: boolean
}

export function BrandsClient({ initialBrands, isAdmin }: BrandsClientProps) {
  const [brands, setBrands] = useState(initialBrands)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '', isActive: true })
  const { toast } = useToast()
  const router = useRouter()

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.description ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm({ name: '', description: '', logoUrl: '', isActive: true })
    setModalOpen(true)
  }

  function openEdit(brand: Brand) {
    setEditing(brand)
    setForm({
      name: brand.name,
      description: brand.description ?? '',
      logoUrl: brand.logoUrl ?? '',
      isActive: brand.isActive,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const url = editing ? `/api/brands/${editing.id}` : '/api/brands'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      toast({ title: editing ? 'Brand updated' : 'Brand created' })
      setModalOpen(false)
      router.refresh()
      const refreshed = await fetch('/api/brands?limit=100').then((r) => r.json())
      if (refreshed.data?.brands) setBrands(refreshed.data.brands)
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(brand: Brand) {
    if (!confirm(`Delete brand "${brand.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/brands/${brand.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setBrands((prev) => prev.filter((b) => b.id !== brand.id))
      toast({ title: 'Brand deleted' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Cannot delete', variant: 'destructive' })
    }
  }

  return (
    <div>
      <PageHeader
        title="Brands"
        description={`${brands.length} brands in your catalog`}
        action={
          isAdmin && (
            <Button onClick={openCreate} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Add Brand
            </Button>
          )
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search brands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl border-slate-200"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No brands found"
          description={search ? 'Try a different search term' : 'Create your first brand to get started'}
          action={isAdmin && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Brand</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {brand.logoUrl ? (
                    <Image src={brand.logoUrl} alt={brand.name} width={48} height={48} className="object-contain" />
                  ) : (
                    <Tag className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => openEdit(brand)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(brand)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-slate-900 text-sm">{brand.name}</h3>
              {brand.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{brand.description}</p>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Package className="h-3.5 w-3.5" />
                  <span>{brand._count.products} products</span>
                </div>
                <Badge
                  variant={brand.isActive ? 'success' : 'secondary'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {brand.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Brand' : 'New Brand'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Nike, Adidas"
                required
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short brand description"
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="mt-1 rounded-xl"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 rounded-xl">
                {loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Brand'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
