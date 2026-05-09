'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon } from './icons'

/**
 * HeroSlider — purely editorial, NOT bound to product data.
 *
 * Why curated visuals: this section sets the brand world (campaign mood,
 * craft, atmosphere) before any commerce. The rest of the homepage is
 * connected to real DB products; the hero stays a campaign film.
 */

type Slide = {
  id: string
  eyebrow: string
  title: string
  /** A single substring inside `title` to render in italic serif accent. */
  accent: string
  subtitle: string
  image: string
}

const SLIDES: Slide[] = [
  {
    id: 'obsidian-ss26',
    eyebrow: 'BENAMI EDIT',
    title: 'Streetwear, selected with intent.',
    accent: 'intent',
    subtitle:
      'Discover curated sneakers, essentials, and everyday pieces made to stand out.',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2400&q=80',
  },
  {
    id: 'campaign-04',
    eyebrow: 'NEW ARRIVALS',
    title: 'Fresh drops, ready to wear.',
    accent: 'drops',
    subtitle: 'Explore the latest pieces available now from the Benami collection.',
    image:
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=2400&q=80',
  },
  {
    id: 'winter-edition',
    eyebrow: 'SNEAKER ROTATION',
    title: 'Built for the street.',
    accent: 'street',
    subtitle: 'From clean silhouettes to bold pairs, find your next rotation.',
    image:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=2400&q=80',
  },
  {
    id: 'objects-02',
    eyebrow: 'LIMITED PIECES',
    title: 'Choose the piece before it disappears.',
    accent: 'disappears',
    subtitle: 'Small quantities, selected styles, and fast WhatsApp ordering.',
    image:
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=2400&q=80',
  },
]

type Props = {
  storeSlug: string
  storeName?: string
  heroImageUrl?: string | null
  /** Optional: anchor id of the section the "Explore" button scrolls to. */
  exploreAnchor?: string
  /** Pause between slides in ms. Default 5200. */
  intervalMs?: number
}

function renderTitle(title: string, accent: string) {
  const i = title.indexOf(accent)
  if (i < 0) return title
  return (
    <>
      {title.slice(0, i)}
      <em className="font-serif italic font-light text-amber-200/95">
        {accent}
      </em>
      {title.slice(i + accent.length)}
    </>
  )
}

export function HeroSlider({
  storeSlug,
  storeName,
  heroImageUrl,
  exploreAnchor = 'featured',
  intervalMs = 5200,
}: Props) {
  const shouldReduceMotion = useReducedMotion()
  const slides = heroImageUrl
    ? [
        {
          id: 'store-hero',
          eyebrow: `${storeName ?? 'STORE'} EDIT`,
          title: 'Curated pieces, ready now.',
          accent: 'ready',
          subtitle: 'Explore the latest selection and order directly in one message.',
          image: heroImageUrl,
        },
        ...SLIDES,
      ]
    : SLIDES
  const count = slides.length
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  // Auto-rotate; pause on hover/focus or when prefers-reduced-motion is set.
  // A timeout resets after manual navigation, keeping the cadence calm and intentional.
  useEffect(() => {
    if (count < 2 || paused || shouldReduceMotion) return
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % count), intervalMs)
    return () => window.clearTimeout(t)
  }, [count, idx, paused, intervalMs, shouldReduceMotion])

  const next = useCallback(() => setIdx((i) => (i + 1) % count), [count])
  const prev = useCallback(() => setIdx((i) => (i - 1 + count) % count), [count])

  const slide = slides[idx]

  const onExplore = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const el = document.getElementById(exploreAnchor)
      if (!el) return
      e.preventDefault()
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [exploreAnchor],
  )

  return (
    <section
      className="relative isolate overflow-hidden bg-slate-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Editorial campaign"
    >
      <div className="relative h-[100svh] min-h-[640px] sm:min-h-[720px] lg:min-h-[820px] max-h-[940px]">
        {/* ── Slide image with crossfade + ken-burns ───────────────────── */}
        <AnimatePresence>
          <motion.div
            key={slide.id}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.025 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1.095 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.11 }}
            transition={{
              opacity: { duration: 1.65, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: Math.max(6.8, intervalMs / 1000 + 2.4), ease: 'easeOut' },
            }}
            className="absolute inset-0 will-change-transform"
            aria-hidden="true"
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={idx === 0}
              sizes="100vw"
              className="object-cover"
            />
            {/* Cinematic gradient overlays (legibility + mood) */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080807] via-black/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* ── Ambient floating glows ───────────────────────────────────── */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-amber-500/[0.10] blur-3xl"
            animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-40 -right-40 h-[40rem] w-[40rem] rounded-full bg-rose-500/[0.07] blur-3xl"
            animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.div
            className="absolute top-1/3 right-1/4 h-[28rem] w-[28rem] rounded-full bg-emerald-500/[0.05] blur-3xl"
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          />
        </div>

        {/* ── Top corner UI: slide counter ─────────────────────────────── */}
        <div className="absolute top-24 sm:top-28 right-4 sm:right-8 z-20 font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">
          {String(idx + 1).padStart(2, '0')} <span className="mx-1.5 text-white/30">/</span>{' '}
          {String(count).padStart(2, '0')}
        </div>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="relative h-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${slide.id}`}
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: 24, filter: 'blur(10px)' }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, filter: 'blur(0px)' }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -10, filter: 'blur(6px)' }
              }
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl will-change-transform"
            >
              <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-amber-200/80 font-semibold mb-5 sm:mb-7">
                {slide.eyebrow}
              </p>

              <h1 className="text-[42px] leading-[0.98] sm:text-6xl lg:text-[88px] lg:leading-[0.95] font-bold tracking-tight text-white mb-6 sm:mb-7 text-balance">
                {renderTitle(slide.title, slide.accent)}
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-white/75 leading-relaxed max-w-xl mb-8 sm:mb-10 text-pretty">
                {slide.subtitle}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${storeSlug}/products`}
                  className="group inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-7 py-4 text-sm font-semibold shadow-2xl shadow-black/50 hover:bg-white/90 hover:-translate-y-0.5 transition-all"
                >
                  Shop Collection
                  <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href={`#${exploreAnchor}`}
                  onClick={onExplore}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.05] backdrop-blur text-white px-7 py-4 text-sm font-semibold hover:bg-white/[0.12] hover:border-white/45 hover:-translate-y-0.5 transition-all"
                >
                  Explore
                  <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Side arrows ──────────────────────────────────────────────── */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-white/20 bg-black/30 backdrop-blur-md hover:bg-black/55 hover:border-white/45 transition-all flex items-center justify-center text-white"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-white/20 bg-black/30 backdrop-blur-md hover:bg-black/55 hover:border-white/45 transition-all flex items-center justify-center text-white"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </>
        )}

        {/* ── Dot indicators ───────────────────────────────────────────── */}
        {count > 1 && (
          <div className="absolute bottom-7 left-4 sm:left-8 z-20 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Go to slide ${i + 1}: ${s.eyebrow}`}
                aria-current={i === idx ? 'true' : undefined}
                className={`h-1 rounded-full transition-all ${
                  i === idx ? 'w-9 bg-white' : 'w-2 bg-white/35 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* ── Scroll indicator (bottom-right vertical) ─────────────────── */}
        <a
          href={`#${exploreAnchor}`}
          onClick={onExplore}
          aria-label="Scroll to next section"
          className="hidden sm:flex absolute bottom-7 right-8 z-20 flex-col items-center gap-2 text-white/55 hover:text-white/85 transition-colors"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <motion.span
            aria-hidden="true"
            className="block h-10 w-px bg-gradient-to-b from-white/60 to-transparent"
            animate={{ scaleY: [0.6, 1, 0.6], originY: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </a>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-[#080807] via-[#080807]/70 to-transparent"
        />
      </div>
    </section>
  )
}
