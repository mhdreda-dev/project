'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon } from 'lucide-react'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

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

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
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

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {preview ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 group">
          <Image src={preview} alt="Product" fill className="object-cover" unoptimized={preview.startsWith('blob:')} />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              Replace
            </Button>
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
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full h-48 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2',
            'text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            (disabled || uploading) && 'opacity-50 cursor-not-allowed',
          )}
        >
          {uploading ? (
            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm font-medium">Click to upload image</span>
              <span className="text-xs">JPG, PNG, WebP — max 5 MB</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
