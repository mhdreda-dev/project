'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon, WhatsAppIcon } from './icons'

export type HeroSlide = {
  id: string
  href: string
  imageUrl: string
  name: string
  price: string
  brand?: string | null
  category?: string | null
}

type Props = {
  slides: HeroSlide[]
  storeSlug: string
  storeName: string
  total: number
  whatsAppUrl?: string | null
  /** Pause between slides in ms. Default 6500. */
  intervalMs?: number
}

export function HeroSlider({
  slides,
  storeSlug,
  storeName,
  total,
  whatsAppUrl,
  intervalMs = 6500,
}: Props) {
  const count = slides.length
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  // Auto-rotate, pause on hover/focus or when reduced-motion is on
  useEffect(() => {
    if (count < 2 || paused) return
    if (typeof window !== 'undefined') {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) return
    }
    const t = window.setInterval(() => setIdx((i) => (i + 1) % count), intervalMs)
    return () => window.clearInterval(t)
  }, [count, paused, intervalMs])

  const next = useCallback(() => setIdx((i) => (i + 1) % count), [count])
  const prev = useCallback(() => setIdx((i) => (i - 1 + count) % count), [count])

  // Fallback hero (no products with images) — clean centered
  if (count === 0) {
    return <FallbackHero storeName={storeName} storeSlug={storeSlug} whatsAppUrl={whatsAppUrl} />
  }

  const slide = slides[idx]

  return (
    <section
      className="relative overflow-hidden bg-slate-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={`${storeName} featured products`}
    >
      <div className="relative h-[82vh] min-h-[560px] sm:min-h-[640px] lg:min-h-[720px] max-h-[820px]">
        {/* Background images, crossfading */}
        <AnimatePresence>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0"
            aria-hidden="true"
          >
            <Image
              src={slide.imageUrl}
              alt=""
              fill
              priority={idx === 0}
              sizes="100vw"
              className="object-cover"
            />
            {/* Cinematic gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-slate-950/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content */}
        <div className="relative h-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${slide.id}`}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
              className="max-w-xl"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85 mb-5 sm:mb-6">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {total} live · {storeName}
              </span>

              {(slide.brand || slide.category) && (
                <p className="text-[11px] uppercase tracking-[0.3em] text-amber-200/85 font-semibold mb-3">
                  {[slide.brand, slide.category].filter(Boolean).join(' · ')}
                </p>
              )}

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.02] mb-5 text-white">
                {slide.name}
              </h1>

              <p className="text-2xl sm:text-3xl font-bold text-white/95 mb-8 tracking-tight">
                {slide.price}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${storeSlug}/products`}
                  className="group inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-6 sm:px-7 py-3.5 sm:py-4 text-sm font-semibold shadow-2xl shadow-black/50 hover:bg-white/90 hover:-translate-y-0.5 transition-all"
                >
                  Shop the collection
                  <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href={slide.href}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/[0.06] backdrop-blur text-white px-6 sm:px-7 py-3.5 sm:py-4 text-sm font-semibold hover:bg-white/[0.12] hover:border-white/50 hover:-translate-y-0.5 transition-all"
                >
                  View product
                  <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Prev / Next arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-white/20 bg-black/30 backdrop-blur-md hover:bg-black/50 hover:border-white/40 transition-all flex items-center justify-center text-white"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-white/20 bg-black/30 backdrop-blur-md hover:bg-black/50 hover:border-white/40 transition-all flex items-center justify-center text-white"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dots */}
        {count > 1 && (
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === idx ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}

        {/* WhatsApp pill (top-right, mobile-friendly) */}
        {whatsAppUrl && (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex absolute top-6 right-6 z-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] backdrop-blur px-4 py-2 text-xs font-semibold text-white hover:bg-white/[0.16] hover:border-white/30 transition-all"
          >
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
            Chat with us
          </a>
        )}
      </div>
    </section>
  )
}

// ─── Fallback (no products with images) ────────────────────────────────────

function FallbackHero({
  storeName,
  storeSlug,
  whatsAppUrl,
}: {
  storeName: string
  storeSlug: string
  whatsAppUrl?: string | null
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-stone-50 to-amber-50/30">
      <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-amber-200/50 to-rose-200/40 blur-3xl motion-safe:animate-sf-orb-1" />
        <div className="absolute top-1/3 -right-24 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-emerald-200/40 to-sky-200/40 blur-3xl motion-safe:animate-sf-orb-2" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.02]">
            {storeName}
          </h1>
          <p className="text-slate-500 font-medium mt-4 text-xl sm:text-2xl tracking-tight">
            Crafted for those who notice the details.
          </p>
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
            New collection coming soon. Check back shortly — we&apos;re restocking.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${storeSlug}/products`}
              className="group inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white px-7 py-4 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-all"
            >
              Browse the catalog
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            {whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 text-slate-900 px-7 py-4 text-sm font-semibold shadow-sm transition-all"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                Chat with us
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
