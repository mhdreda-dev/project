'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
}

/**
 * ScrollHeader — sticky editorial navbar.
 *
 * Always dark glass so the same bar reads consistently over both the
 * cinematic dark hero and the light product / listing pages. Intensity
 * (opacity, blur, shadow, edge line) ramps when the viewport scrolls.
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
    <motion.header
      className={cn(
        'sticky top-0 z-30 transition-[backdrop-filter,border-color] duration-300',
        scrolled
          ? 'backdrop-blur-xl border-b border-white/10'
          : 'backdrop-blur-md border-b border-white/5',
        className,
      )}
      initial={false}
      animate={{
        backgroundColor: scrolled
          ? 'rgba(10, 10, 10, 0.85)'
          : 'rgba(10, 10, 10, 0.45)',
        boxShadow: scrolled
          ? '0 1px 24px -12px rgba(0, 0, 0, 0.6)'
          : '0 0px 0px 0px rgba(0, 0, 0, 0)',
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.header>
  )
}
