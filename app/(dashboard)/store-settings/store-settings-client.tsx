'use client'

import { useState } from 'react'
import { Loader2, Save, Store, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BrandLogoUpload } from '@/components/ui/brand-logo-upload'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/hooks/use-toast'

type StoreSettings = {
  id: string
  name: string
  slug: string
  phone: string | null
  whatsapp: string | null
  address: string | null
  logoUrl: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  shortDescription: string | null
  heroImageUrl: string | null
  primaryColor: string | null
  isActive: boolean
}

type FormState = {
  name: string
  phone: string
  whatsapp: string
  address: string
  logoUrl: string
  instagramUrl: string
  facebookUrl: string
  shortDescription: string
  heroImageUrl: string
  primaryColor: string
}

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

function normalizeMoroccoPhone(value: string) {
  const digits = digitsOnly(value)
  if (!digits) return ''
  if (digits.startsWith('212')) return `+${digits}`
  if (digits.startsWith('0')) return `+212${digits.slice(1)}`
  return value.trim().startsWith('+') ? value.trim() : `+${digits}`
}

function toForm(store: StoreSettings): FormState {
  return {
    name: store.name ?? '',
    phone: store.phone ?? '',
    whatsapp: store.whatsapp ?? '',
    address: store.address ?? '',
    logoUrl: store.logoUrl ?? '',
    instagramUrl: store.instagramUrl ?? '',
    facebookUrl: store.facebookUrl ?? '',
    shortDescription: store.shortDescription ?? '',
    heroImageUrl: store.heroImageUrl ?? '',
    primaryColor: store.primaryColor ?? '#fcd34d',
  }
}

export function StoreSettingsClient({ initialStore }: { initialStore: StoreSettings }) {
  const [form, setForm] = useState<FormState>(() => toForm(initialStore))
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/store-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          address: form.address || null,
          logoUrl: form.logoUrl || null,
          instagramUrl: form.instagramUrl || null,
          facebookUrl: form.facebookUrl || null,
          shortDescription: form.shortDescription || null,
          heroImageUrl: form.heroImageUrl || null,
          primaryColor: form.primaryColor || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Unable to save store settings')
      toast({ title: 'Store settings saved' })
    } catch (error) {
      toast({
        title: 'Unable to save settings',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Store className="h-4 w-4" />
            <span>/{initialStore.slug}</span>
            <a
              href={`/${initialStore.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              View storefront
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Store Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Customize the storefront identity, contact details, and campaign visuals for this store only.
          </p>
        </div>
        <Button type="submit" disabled={saving} className="gap-2 rounded-xl">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Store identity</CardTitle>
              <CardDescription>Name, description, and storefront accent color.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Store name" htmlFor="name">
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  className="rounded-xl border-slate-200"
                />
              </Field>
              <Field label="Primary accent color" htmlFor="primaryColor">
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => update('primaryColor', e.target.value)}
                    className="h-10 w-14 rounded-xl border-slate-200 p-1"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => update('primaryColor', e.target.value)}
                    placeholder="#fcd34d"
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </Field>
              <Field label="Short description" htmlFor="shortDescription" className="sm:col-span-2">
                <textarea
                  id="shortDescription"
                  value={form.shortDescription}
                  onChange={(e) => update('shortDescription', e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="A short brand line shown in the storefront footer and metadata."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Contact and social links</CardTitle>
              <CardDescription>These values power footer contact, COD, and WhatsApp links.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" htmlFor="phone">
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  onBlur={() => update('phone', normalizeMoroccoPhone(form.phone))}
                  placeholder="+212 ..."
                  className="rounded-xl border-slate-200"
                />
              </Field>
              <Field label="WhatsApp" htmlFor="whatsapp">
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => update('whatsapp', e.target.value)}
                  onBlur={() => update('whatsapp', normalizeMoroccoPhone(form.whatsapp))}
                  placeholder="+212 ..."
                  className="rounded-xl border-slate-200"
                />
              </Field>
              <Field label="Address" htmlFor="address" className="sm:col-span-2">
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Store address"
                  className="rounded-xl border-slate-200"
                />
              </Field>
              <Field label="Instagram URL" htmlFor="instagramUrl">
                <Input
                  id="instagramUrl"
                  value={form.instagramUrl}
                  onChange={(e) => update('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="rounded-xl border-slate-200"
                />
              </Field>
              <Field label="Facebook URL" htmlFor="facebookUrl">
                <Input
                  id="facebookUrl"
                  value={form.facebookUrl}
                  onChange={(e) => update('facebookUrl', e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="rounded-xl border-slate-200"
                />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Logo</CardTitle>
              <CardDescription>Used in the storefront navbar, footer, metadata, and social previews.</CardDescription>
            </CardHeader>
            <CardContent>
              <BrandLogoUpload
                value={form.logoUrl}
                brandName={form.name}
                onChange={(logoUrl) => update('logoUrl', logoUrl)}
                disabled={saving}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Hero image</CardTitle>
              <CardDescription>Optional first campaign image for the storefront homepage hero.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={form.heroImageUrl}
                onChange={(url) => update('heroImageUrl', url ?? '')}
                disabled={saving}
                className="[&_.h-48]:h-56"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
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
  children: React.ReactNode
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
