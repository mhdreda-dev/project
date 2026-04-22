'use client'

import { useState, useRef, useEffect } from 'react'
import { SafeImage } from '@/components/ui/safe-image'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/components/i18n-provider'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  disabled?: boolean
  className?: string
}

export function ImageUpload({ value, onChange, disabled, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | undefined>(value)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { t } = useI18n()

  // Sync preview when value changes externally (edit mode)
  useEffect(() => {
    setPreview(value)
  }, [value])

  // Probe once whether uploads are configured
  useEffect(() => {
    let cancelled = false
    fetch('/api/upload')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setConfigured(Boolean(d?.configured)) })
      .catch(() => { if (!cancelled) setConfigured(false) })
    return () => { cancelled = true }
  }, [])

  const handleFile = async (file: File) => {
    if (!file) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      toast({
        title: t('imageUpload.unsupportedTitle'),
        description: t('imageUpload.unsupportedDescription', { type: file.type || 'unknown' }),
        variant: 'destructive',
      })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      const mb = (file.size / 1024 / 1024).toFixed(1)
      toast({
        title: t('imageUpload.fileTooLargeTitle'),
        description: t('imageUpload.fileTooLargeDescription', { size: mb }),
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
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))

      if (res.status === 503 || data?.code === 'UPLOAD_NOT_CONFIGURED') {
        setConfigured(false)
        toast({
          title: t('imageUpload.unavailableTitle'),
          description: t('imageUpload.unavailableDescription'),
          variant: 'destructive',
        })
        setPreview(value)
        onChange(value)
        return
      }

      if (!res.ok) throw new Error(data.error ?? data.message ?? t('imageUpload.uploadFailedStatus', { status: res.status }))
      onChange(data.url)
      setPreview(data.url)
    } catch (e) {
      toast({
        title: t('imageUpload.uploadFailedTitle'),
        description: e instanceof Error ? e.message : t('imageUpload.tryAgain'),
        variant: 'destructive',
      })
      setPreview(value)
      onChange(value)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(undefined)
    onChange(undefined)
    if (inputRef.current) inputRef.current.value = ''
  }

  const uploadDisabled = disabled || uploading || configured === false

  return (
    <div className={cn('relative space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={uploadDisabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {preview ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 group">
          <SafeImage src={preview} alt="Product" fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {configured !== false && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={uploadDisabled}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                {t('common.actions.replace')}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={disabled || uploading}
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={uploadDisabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full h-48 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2',
            'text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            uploadDisabled && 'opacity-60 cursor-not-allowed hover:bg-transparent hover:border-slate-200',
          )}
        >
          {uploading ? (
            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : configured === false ? (
            <>
              <AlertCircle className="h-7 w-7 text-amber-500" />
              <span className="text-sm font-medium text-slate-600">{t('imageUpload.unavailableInlineTitle')}</span>
              <span className="text-xs text-slate-400 text-center px-4">
                {t('imageUpload.unavailableInlineDescription')}
              </span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm font-medium">{t('imageUpload.clickToUpload')}</span>
              <span className="text-xs">{t('imageUpload.formats')}</span>
            </>
          )}
        </button>
      )}

      {configured === false && preview && (
        <p className="text-xs text-amber-600 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          {t('imageUpload.configuredNote')}
        </p>
      )}
    </div>
  )
}
