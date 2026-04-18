'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

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

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Use JPG, PNG or WebP', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum size is 5 MB', variant: 'destructive' })
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
          title: 'Image upload unavailable',
          description: 'The server is not configured for image uploads. The product will be saved without an image.',
          variant: 'destructive',
        })
        setPreview(value)
        onChange(value)
        return
      }

      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      onChange(data.url)
      setPreview(data.url)
    } catch (e) {
      toast({
        title: 'Upload failed',
        description: e instanceof Error ? e.message : 'Please try again',
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
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        disabled={uploadDisabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {preview ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 group">
          <Image src={preview} alt="Product" fill className="object-cover" unoptimized={preview.startsWith('blob:')} />
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
                Replace
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
              <span className="text-sm font-medium text-slate-600">Image upload unavailable</span>
              <span className="text-xs text-slate-400 text-center px-4">
                Server not configured. You can still save the product without an image.
              </span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm font-medium">Click to upload image</span>
              <span className="text-xs">JPG, PNG, WebP — max 5 MB</span>
            </>
          )}
        </button>
      )}

      {configured === false && preview && (
        <p className="text-xs text-amber-600 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          Image upload is not configured. You can remove the image but not replace it.
        </p>
      )}
    </div>
  )
}
