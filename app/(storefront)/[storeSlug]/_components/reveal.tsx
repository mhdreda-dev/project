'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'up' | 'fade' | 'scale'

type Props = {
  children: React.ReactNode
  className?: string
  /** ms to delay the transition once the element enters the viewport. */
  delay?: number
  variant?: Variant
  /** Trigger threshold (0..1). Default 0.1. */
  threshold?: number
}

/**
 * Reveal — wraps children in a div that fades/slides into view the first
 * time it enters the viewport. Lightweight (one IntersectionObserver per
 * instance, observer disconnects after first trigger).
 *
 * Honors prefers-reduced-motion: renders content instantly with no animation.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = 'up',
  threshold = 0.1,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const prefers = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefers) {
      setReduced(true)
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            obs.disconnect()
          }
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  const transition = reduced
    ? ''
    : 'transition-all duration-700 ease-out will-change-transform'

  const initial = !visible
    ? variant === 'scale'
      ? 'opacity-0 scale-[0.96]'
      : variant === 'fade'
        ? 'opacity-0'
        : 'opacity-0 translate-y-6'
    : 'opacity-100 translate-y-0 scale-100'

  return (
    <div
      ref={ref}
      style={delay && !reduced ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(transition, initial, className)}
    >
      {children}
    </div>
  )
}
