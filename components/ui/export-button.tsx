'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/components/i18n-provider'

interface ExportButtonProps {
  /** API path that returns text/csv. Query string optional. */
  endpoint: string
  /** Filename without extension (a timestamp + .csv is appended). */
  filename: string
  /** Visible button label. Defaults to "Export CSV". */
  label?: string
  /** Pass current filter query params to scope the export. */
  params?: Record<string, string | number | undefined | null>
  /** Button visual variant. */
  variant?: 'default' | 'outline' | 'ghost'
  /** Disable state from parent (e.g. no rows to export). */
  disabled?: boolean
  className?: string
}

/**
 * Streams CSV from the server and triggers a browser download.
 * The server route is responsible for access control and building the rows;
 * this button only cares about turning the response into a file.
 */
export function ExportButton({
  endpoint,
  filename,
  label,
  params,
  variant = 'outline',
  disabled,
  className,
}: ExportButtonProps) {
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const { t } = useI18n()

  const buttonLabel = label ?? t('common.actions.exportCsv')

  async function handleClick() {
    setBusy(true)
    try {
      const qs = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
        })
      }
      const url = qs.toString() ? `${endpoint}?${qs}` : endpoint
      const res = await fetch(url, { headers: { Accept: 'text/csv' } })
      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        throw new Error(msg || t('export.failedStatus', { status: res.status }))
      }
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      const stamp = new Date().toISOString().slice(0, 10)
      a.download = `${filename}-${stamp}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
      toast({ title: t('export.readyTitle'), description: t('export.readyDescription', { filename: a.download }) })
    } catch (e) {
      toast({
        title: t('export.failedTitle'),
        description: e instanceof Error ? e.message : t('imageUpload.tryAgain'),
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      disabled={busy || disabled}
      className={className ?? 'gap-2 rounded-xl'}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {buttonLabel}
    </Button>
  )
}
