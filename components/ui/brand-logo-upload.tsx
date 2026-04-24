'use client'

import { useEffect, useRef, useState } from 'react'
import { ImageIcon, Link2, Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SafeImage } from '@/components/ui/safe-image'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useI18n } from '@/components/i18n-provider'

interface BrandLogoUploadProps {
  value?: string
  brandName?: string
  onChange: (url: string) => void
  disabled?: boolean
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 3 * 1024 * 1024

function initials(name?: string) {
  const parts = (name || 'Brand').trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'BR'
}

export function BrandLogoUpload({ value, brandName, onChange, disabled }: BrandLogoUploadProps) {
  const [preview, setPreview] = useState(value || '')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { t } = useI18n()

  useEffect(() => {
    setPreview(value || '')
  }, [value])

  useEffect(() => {
    let cancelled = false
    fetch('/api/upload/brand-logo')
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setConfigured(Boolean(data?.configured)) })
      .catch(() => { if (!cancelled) setConfigured(false) })
    return () => { cancelled = true }
  }, [])

  async function uploadFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: t('brandLogo.unsupportedTitle'),
        description: t('brandLogo.unsupportedDescription'),
        variant: 'destructive',
      })
      return
    }

    if (file.size > MAX_SIZE) {
      toast({
        title: t('brandLogo.tooLargeTitle'),
        description: t('brandLogo.tooLargeDescription'),
        variant: 'destructive',
      })
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload/brand-logo', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))

      if (res.status === 503 || data?.code === 'UPLOAD_NOT_CONFIGURED') {
        setConfigured(false)
        throw new Error(t('brandLogo.uploadUnavailable'))
      }
      if (!res.ok) throw new Error(data.error || t('brandLogo.uploadFailed'))

      setPreview(data.url)
      onChange(data.url)
      toast({ title: t('brandLogo.uploaded') })
    } catch (e) {
      setPreview(value || '')
      toast({
        title: t('brandLogo.uploadFailed'),
        description: e instanceof Error ? e.message : t('imageUpload.tryAgain'),
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
      URL.revokeObjectURL(localUrl)
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && !disabled && !uploading && configured !== false) uploadFile(file)
  }

  function handleRemove() {
    setPreview('')
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const uploadDisabled = disabled || uploading || configured === false

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
        disabled={uploadDisabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadFile(file)
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!uploadDisabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 transition-colors',
          dragging && 'border-blue-400 bg-blue-50',
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white sm:mx-0">
            {preview ? (
              <SafeImage
                src={preview}
                alt={t('brandLogo.previewAlt', { name: brandName || 'brand' })}
                fill
                sizes="96px"
                className="object-contain p-3"
                fallbackClassName="bg-white"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-lg font-semibold text-slate-500">
                {initials(brandName)}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-slate-800">{t('brandLogo.dropTitle')}</p>
            <p className="mt-1 text-xs text-slate-500">{t('brandLogo.formats')}</p>
            {configured === false && (
              <p className="mt-1 text-xs text-amber-600">{t('brandLogo.uploadUnavailable')}</p>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-xl"
                disabled={uploadDisabled}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {preview ? t('brandLogo.changeImage') : t('brandLogo.uploadImage')}
              </Button>
              {preview && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 rounded-xl text-slate-500 hover:text-red-600"
                  disabled={disabled || uploading}
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                  {t('brandLogo.removeImage')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600"
        onClick={() => setShowUrlInput((open) => !open)}
      >
        <Link2 className="h-3.5 w-3.5" />
        {t('brandLogo.useImageUrl')}
      </button>

      {showUrlInput && (
        <div className="space-y-1">
          <Label htmlFor="brand-logo-url" className="text-xs text-slate-500">
            {t('common.labels.logoUrl')}
          </Label>
          <Input
            id="brand-logo-url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('common.placeholders.logoUrl')}
            disabled={disabled || uploading}
            className="rounded-xl"
          />
        </div>
      )}
    </div>
  )
}
