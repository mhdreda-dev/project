'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
}

/**
 * ScrollHeader — sticky header wrapper whose background opacity, blur, and
 * shadow react to vertical scroll. Uses requestAnimationFrame throttling.
 */
export function ScrollHeader({ children, className }: Props) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 16)
          ticking = false
        })
        ticking = true
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-all duration-300',
        scrolled
          ? 'bg-stone-50/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_24px_-12px_rgb(15_23_42_/_0.15)]'
          : 'bg-stone-50/60 backdrop-blur-md border-b border-slate-200/30',
        className,
      )}
    >
      {children}
    </header>
  )
}
