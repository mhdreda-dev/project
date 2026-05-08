'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { WhatsAppIcon } from './icons'

type Props = {
  url: string
  /** Hide on small screens (mobile usually has a fixed bottom CTA already). */
  desktopOnly?: boolean
  label?: string
}

/**
 * WhatsAppFab — floating bottom-right WhatsApp button.
 * Bounces in shortly after page load, hidden during initial paint.
 */
export function WhatsAppFab({ url, desktopOnly = true, label = 'Order on WhatsApp' }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setShow(true)
      return
    }
    const t = window.setTimeout(() => setShow(true), 1200)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        'fixed bottom-6 right-6 z-40 flex items-center justify-center',
        'h-14 w-14 rounded-full text-white shadow-2xl shadow-emerald-500/30',
        'bg-[#25D366] hover:bg-[#1ebe57]',
        'transition-all duration-500 ease-out will-change-transform',
        'hover:scale-110 active:scale-95',
        desktopOnly && 'hidden lg:flex',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none',
      )}
    >
      {/* Soft pulse ring */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 motion-safe:animate-ping"
        style={{ animationDuration: '2.4s' }}
      />
      <WhatsAppIcon className="relative h-6 w-6" />
    </a>
  )
}
