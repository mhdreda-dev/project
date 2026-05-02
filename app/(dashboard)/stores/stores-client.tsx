'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

type StoreRow = {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string | Date
  users: { id: string; name: string; email: string; isActive: boolean }[]
  _count: { users: number; products: number }
}

export function StoresClient({ initialStores }: { initialStores: StoreRow[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Stores</h1>
          <p className="text-muted-foreground mt-1">Create shops and assign their first admin.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Store
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All stores</CardTitle>
          <CardDescription>{initialStores.length} stores configured</CardDescription>
        </CardHeader>
        <CardContent>
          {initialStores.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No stores yet.</p>
          ) : (
            <div className="divide-y">
              {initialStores.map((store) => {
                const admin = store.users[0]
                return (
                  <div key={store.id} className="py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{store.name}</p>
                          <Badge variant={store.isActive ? 'success' : 'secondary'}>
                            {store.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">/{store.slug}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Admin: {admin ? `${admin.name} (${admin.email})` : 'None'} · Users {store._count.users} · Products {store._count.products}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground md:text-right">
                      {store.phone && <p>{store.phone}</p>}
                      {store.address && <p>{store.address}</p>}
                      <p className="text-xs">Created {formatDate(store.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateStoreDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false)
          toast({ title: 'Store created' })
          router.refresh()
        }}
      />
    </div>
  )
}

function CreateStoreDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const payload = {
      name: form.get('name'),
      slug: form.get('slug'),
      phone: form.get('phone') || null,
      address: form.get('address') || null,
      isActive: form.get('isActive') === 'on',
      admin: {
        name: form.get('adminName'),
        email: form.get('adminEmail'),
        password: form.get('adminPassword'),
      },
    }

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create store')
      onSuccess()
    } catch (error) {
      toast({
        title: 'Unable to create store',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Store</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">Store name *</Label>
              <Input id="name" name="name" placeholder="Benami Rabat" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" name="slug" placeholder="benami-rabat" pattern="[a-z0-9-]+" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="+212 ..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="Store address" />
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <p className="text-sm font-medium">Store admin</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="adminName">Admin name *</Label>
                <Input id="adminName" name="adminName" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="adminEmail">Admin email *</Label>
                <Input id="adminEmail" name="adminEmail" type="email" required />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="adminPassword">Admin password *</Label>
                <Input id="adminPassword" name="adminPassword" type="password" required />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300" />
            Active store
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Store
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
