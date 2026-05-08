import Image from 'next/image'
import { cn } from '@/lib/utils'

type Variant = 'mark' | 'inline' | 'hero'
type Size = 'sm' | 'md' | 'lg' | 'xl'

type Props = {
  storeName: string
  /** Image URL — when present, takes precedence over the text fallback. */
  src?: string | null
  variant?: Variant
  size?: Size
  /** Subtle floating motion (respects prefers-reduced-motion). */
  animate?: boolean
  /** Add an entrance scale-in animation. */
  reveal?: boolean
  className?: string
  priority?: boolean
}

const SIZE_PX: Record<Size, number> = { sm: 28, md: 36, lg: 56, xl: 96 }
const SIZE_TEXT: Record<Size, string> = {
  sm: 'text-[11px]',
  md: 'text-sm',
  lg: 'text-xl',
  xl: 'text-3xl',
}

/**
 * StorefrontLogo — single source of truth for the per-store brand mark.
 *
 * Usage patterns:
 *   <StorefrontLogo storeName={store.name} src={getStoreLogoUrl(store.slug)} />        // mark
 *   <StorefrontLogo storeName={store.name} variant="inline" />                          // mark + name
 *   <StorefrontLogo storeName={store.name} variant="hero" size="xl" animate reveal />   // hero
 *
 * Replace the fallback by adding an entry to `lib/storefront/logos.ts`.
 */
export function StorefrontLogo({
  storeName,
  src,
  variant = 'mark',
  size = 'md',
  animate = false,
  reveal = false,
  className,
  priority = false,
}: Props) {
  const initial = storeName.trim().charAt(0).toUpperCase() || 'S'
  const px = SIZE_PX[size]

  const animateClasses = cn(
    animate && 'motion-safe:animate-sf-float',
    reveal && 'motion-safe:animate-sf-scale-in',
  )

  const Mark = src ? (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-slate-200 shadow-sm',
        animateClasses,
        className,
      )}
      style={{ width: px, height: px }}
    >
      <Image
        src={src}
        alt={`${storeName} logo`}
        width={px}
        height={px}
        priority={priority}
        className="h-full w-full object-contain"
      />
    </div>
  ) : (
    <div
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-slate-900 text-stone-100 font-semibold tracking-wide',
        SIZE_TEXT[size],
        animateClasses,
        className,
      )}
      style={{ width: px, height: px }}
      aria-label={`${storeName} logo`}
    >
      {initial}
    </div>
  )

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2.5 min-w-0">
        {Mark}
        <span className="text-base font-semibold tracking-tight text-slate-900 truncate">
          {storeName}
        </span>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <div className="relative inline-flex items-center justify-center">
        {/* Soft halo */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-amber-300/40 via-rose-300/30 to-emerald-300/30 blur-3xl motion-safe:animate-sf-glow-pulse"
          style={{ transform: 'scale(2.2)' }}
        />
        {Mark}
      </div>
    )
  }

  return Mark
}
