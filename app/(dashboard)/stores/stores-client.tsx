'use client'

import { type ReactNode, useState } from 'react'
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
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl sm:max-w-3xl">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12 sm:px-6">
          <DialogTitle>Create Store</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 px-5 py-5 sm:px-6">
            <div className="space-y-4">
              <StoreFormSection title="Store information" description="Core identity and public URL for this shop.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Store name *" htmlFor="name">
                    <Input id="name" name="name" placeholder="Benami Rabat" required className="rounded-xl border-slate-200 bg-white" />
                  </Field>
                  <Field label="Slug *" htmlFor="slug">
                    <Input id="slug" name="slug" placeholder="benami-rabat" pattern="[a-z0-9-]+" required className="rounded-xl border-slate-200 bg-white" />
                  </Field>
                </div>
              </StoreFormSection>

              <StoreFormSection title="Store branding/contact" description="Contact details customers and operators will recognize.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone / WhatsApp" htmlFor="phone">
                    <Input id="phone" name="phone" placeholder="+212 ..." className="rounded-xl border-slate-200 bg-white" />
                  </Field>
                  <Field label="Address" htmlFor="address">
                    <Input id="address" name="address" placeholder="Store address" className="rounded-xl border-slate-200 bg-white" />
                  </Field>
                </div>
              </StoreFormSection>

              <StoreFormSection title="Store admin" description="This user will manage the store after creation.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Admin name *" htmlFor="adminName">
                    <Input id="adminName" name="adminName" required className="rounded-xl border-slate-200 bg-white" />
                  </Field>
                  <Field label="Admin email *" htmlFor="adminEmail">
                    <Input id="adminEmail" name="adminEmail" type="email" required className="rounded-xl border-slate-200 bg-white" />
                  </Field>
                  <Field label="Admin password *" htmlFor="adminPassword" className="sm:col-span-2">
                    <Input id="adminPassword" name="adminPassword" type="password" required className="rounded-xl border-slate-200 bg-white" />
                  </Field>
                </div>
              </StoreFormSection>

              <StoreFormSection title="Status" description="Inactive stores remain hidden from active store workflows.">
                <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <span>
                    <span className="block font-medium text-slate-900">Active store</span>
                    <span className="text-xs text-slate-500">Enable this shop immediately after creation.</span>
                  </span>
                  <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </label>
              </StoreFormSection>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Store
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StoreFormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  htmlFor,
  className = '',
  children,
}: {
  label: string
  htmlFor: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-slate-700">
        {label}
      </Label>
      {children}
    </div>
  )
}
