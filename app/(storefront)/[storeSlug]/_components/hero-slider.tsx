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
  whatsAppUrl?: string | null
  /** Optional: anchor id of the section the "Explore" button scrolls to. */
  exploreAnchor?: string
  /** Pause between slides in ms. Default 5200. */
  intervalMs?: number
  variant?: 'default' | 'benami'
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
  whatsAppUrl,
  exploreAnchor = 'featured',
  intervalMs = 5200,
  variant = 'default',
}: Props) {
  const shouldReduceMotion = useReducedMotion()
  const isBenami = variant === 'benami'
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
      <div className={`relative ${isBenami ? 'min-h-[650px] sm:min-h-[720px] lg:min-h-[780px] lg:max-h-[900px]' : 'min-h-[calc(100svh-104px)] sm:min-h-[720px] lg:min-h-[820px] lg:max-h-[940px]'}`}>
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
            <div className={`absolute inset-0 bg-gradient-to-r ${isBenami ? 'from-black/92 via-black/54 to-black/18' : 'from-black/90 via-black/48 to-black/20'}`} />
            <div className={`absolute inset-0 bg-gradient-to-t ${isBenami ? 'from-[#080807] via-black/40 to-black/10' : 'from-[#080807] via-black/35 to-black/15'}`} />
          </motion.div>
        </AnimatePresence>

        {/* ── Editorial texture ────────────────────────────────────────── */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.08] [mask-image:linear-gradient(180deg,black,transparent_82%)]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.32) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <div
            className={`absolute inset-0 ${isBenami ? 'opacity-55' : 'opacity-70'}`}
            style={{
              background:
                'linear-gradient(115deg, rgba(251,191,36,0.18) 0%, transparent 34%, rgba(255,255,255,0.06) 50%, transparent 72%)',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-48"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, rgba(8,8,7,0.78) 58%, #080807 100%)',
            }}
          />
        </div>

        {/* ── Top corner UI: slide counter ─────────────────────────────── */}
        <div className="absolute right-4 top-[4.5rem] z-20 rounded-full border border-white/10 bg-black/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/65 backdrop-blur-sm sm:right-8 sm:top-28">
          {String(idx + 1).padStart(2, '0')} <span className="mx-1.5 text-white/30">/</span>{' '}
          {String(count).padStart(2, '0')}
        </div>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className={`relative z-10 mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8 ${isBenami ? 'min-h-[650px] pb-20 pt-24 sm:min-h-[720px] sm:pb-24 sm:pt-24 lg:min-h-[780px]' : 'min-h-[calc(100svh-104px)] pb-24 pt-16 sm:min-h-[720px] sm:pb-28 sm:pt-24 lg:min-h-[820px]'}`}>
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
              className={isBenami ? 'max-w-[46rem] will-change-transform' : 'max-w-3xl will-change-transform'}
            >
              <p className="mb-4 inline-flex max-w-full items-center gap-3 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100/85 backdrop-blur-sm sm:mb-7 sm:text-[11px] sm:tracking-[0.26em]">
                <span className="h-px w-5 bg-amber-200/70" aria-hidden="true" />
                {slide.eyebrow}
              </p>

              <h1 className={`mb-5 font-bold text-white text-balance sm:mb-7 ${isBenami ? 'text-[42px] leading-[0.94] tracking-[-0.045em] sm:text-6xl lg:text-[86px] lg:leading-[0.9]' : 'text-[44px] leading-[0.96] tracking-tight sm:text-6xl lg:text-[92px] lg:leading-[0.92]'}`}>
                {renderTitle(slide.title, slide.accent)}
              </h1>

              <p className={`max-w-xl text-base leading-relaxed text-white/76 text-pretty sm:text-lg ${isBenami ? 'mb-6 lg:mb-8 lg:text-[19px]' : 'mb-7 sm:mb-10 lg:text-xl'}`}>
                {slide.subtitle}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href={`/${storeSlug}/products`}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-slate-950 shadow-2xl shadow-black/50 transition-all hover:-translate-y-0.5 hover:bg-white/90 sm:w-auto sm:px-7"
                >
                  Voir les produits
                  <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                {whatsAppUrl ? (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/55 bg-[#25D366] px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-emerald-950/45 transition-all hover:-translate-y-0.5 hover:bg-[#1ebe57] sm:w-auto sm:px-7"
                  >
                    Commander sur WhatsApp
                    <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <a
                    href={`#${exploreAnchor}`}
                    onClick={onExplore}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-6 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/[0.12] sm:w-auto sm:px-7"
                  >
                    Explorer
                    <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>

              <div className={`${isBenami ? 'mt-6 sm:mt-8' : 'mt-8 sm:mt-10'} grid max-w-xl grid-cols-3 gap-2 border-y border-white/10 py-4 sm:gap-4`}>
                {['Stock live', 'Réponse rapide', 'Sélection premium'].map((item) => (
                  <div key={item} className="min-w-0">
                    <p className="text-center font-mono text-[8px] uppercase leading-relaxed tracking-[0.14em] text-white/50 sm:text-left sm:text-[10px] sm:tracking-[0.18em]">
                      {item}
                    </p>
                  </div>
                ))}
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
              className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-all hover:border-white/45 hover:bg-black/55 sm:left-6 sm:flex sm:h-12 sm:w-12"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-all hover:border-white/45 hover:bg-black/55 sm:right-6 sm:flex sm:h-12 sm:w-12"
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
