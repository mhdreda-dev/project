import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getPublicStore,
  getPublicProducts,
  getPublicCategories,
} from '@/lib/storefront/storefront.service'
import { buildStoreWhatsAppUrl } from '@/lib/storefront/whatsapp'
import { getStoreLogoUrl } from '@/lib/storefront/logos'
import { Reveal } from './_components/reveal'
import { HeroSlider } from './_components/hero-slider'
import { FeaturedProducts } from './_components/featured-products'
import { LookbookSection } from './_components/lookbook-section'
import {
  ArrowRightIcon,
  BoltIcon,
  CheckBadgeIcon,
  EmptyBoxIcon,
  WhatsAppIcon,
} from './_components/icons'

export const dynamic = 'force-dynamic'

type Props = {
  params: { storeSlug: string }
}

export default async function StorefrontHomePage({ params }: Props) {
  const store = await getPublicStore(params.storeSlug)
  if (!store) notFound()

  // Fetch enough products to power: featured grid (8) + lookbook (6).
  // Hero is editorial and intentionally NOT driven by DB products.
  const [{ products }, categories] = await Promise.all([
    getPublicProducts(store.id, { page: 1, limit: 12 }),
    getPublicCategories(store.id),
  ])

  const whatsAppUrl = buildStoreWhatsAppUrl(store)
  // logoUrl/StorefrontLogo is rendered by the storefront layout's header.
  void getStoreLogoUrl

  // Featured grid uses up to 8 of the latest products
  const featured = products.slice(0, 8)

  return (
    <div className="relative">
      {/* ── Editorial hero (curated visuals — NOT bound to DB products) ── */}
      <HeroSlider storeSlug={store.slug} exploreAnchor="featured" />

      {/* ── Trust strip — dark editorial ─────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/25 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-300/[0.045] blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-0">
          <Reveal delay={0} className="sm:pr-8">
            <TrustBadge
              num="01"
              icon={<WhatsAppIcon className="h-5 w-5 text-[#25D366]" />}
              title="WhatsApp Concierge"
              description="One tap. No checkout, no account. Real humans on the other end."
            />
          </Reveal>
          <Reveal delay={120} className="sm:border-l sm:border-white/10 sm:px-8">
            <TrustBadge
              num="02"
              icon={<BoltIcon className="h-5 w-5 text-amber-300" />}
              title="Express Reply"
              description="Average response within minutes during business hours."
            />
          </Reveal>
          <Reveal delay={240} className="sm:border-l sm:border-white/10 sm:pl-8">
            <TrustBadge
              num="03"
              icon={<CheckBadgeIcon className="h-5 w-5 text-emerald-300" />}
              title="Live Inventory"
              description="Real-time stock signed at the atelier — no surprises after you order."
            />
          </Reveal>
        </div>
      </section>

      {/* ── Featured products (real DB products) ─────────────────────────── */}
      <div id="featured" className="scroll-mt-20">
        <FeaturedProducts products={featured} storeSlug={store.slug} />
      </div>

      {/* ── Cinematic lookbook (real product imagery) ───────────────────── */}
      <LookbookSection products={products} storeSlug={store.slug} />

      {/* ── Categories ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="relative overflow-hidden text-white py-20 sm:py-28">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/20 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-amber-400/[0.055] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-emerald-400/[0.04] blur-3xl"
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="mb-10 sm:mb-14 max-w-3xl">
                <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-amber-200/70 font-semibold mb-5 flex items-center gap-3">
                  <span aria-hidden="true" className="w-6 h-px bg-amber-300/60" />
                  <span>04 / Universe</span>
                </p>
                <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl leading-[1.05] text-white text-balance">
                  Shop by{' '}
                  <em className="italic font-light text-amber-200/95">category</em>.
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat, idx) => (
                <Reveal key={cat} delay={idx * 50} variant="scale">
                  <Link
                    href={`/${store.slug}/products?category=${encodeURIComponent(cat)}`}
                    className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white backdrop-blur hover:border-amber-200/45 hover:bg-white/[0.08] transition-all"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-[10px] tracking-[0.28em] uppercase text-white/40">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="mt-1 block truncate font-mono text-[11px] sm:text-xs tracking-[0.22em] uppercase text-white/85">
                        {cat}
                      </span>
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-black/20 text-white/70 group-hover:border-amber-200/60 group-hover:text-amber-100 transition-all">
                      <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WhatsApp CTA strip — editorial concierge card ───────────────── */}
      {whatsAppUrl && (
        <section className="relative px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/20 to-transparent"
          />
          <Reveal variant="scale">
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-14 text-white shadow-2xl shadow-black/35 backdrop-blur-md sm:px-12 sm:py-24">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-amber-400/[0.12] blur-3xl motion-safe:animate-sf-orb-1"
              />
              <div
                aria-hidden="true"
                className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-400/[0.08] blur-3xl motion-safe:animate-sf-orb-2"
              />

              <div className="relative max-w-2xl">
                <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-amber-200/70 font-semibold mb-5 flex items-center gap-3">
                  <span aria-hidden="true" className="w-6 h-px bg-amber-300/60" />
                  <span>05 / Concierge</span>
                </p>
                <h3 className="font-serif text-3xl sm:text-5xl lg:text-6xl leading-[1.05] mb-5 text-balance">
                  Have a{' '}
                  <em className="italic font-light text-amber-200/95">question?</em>
                </h3>
                <p className="text-white/65 text-base sm:text-lg leading-relaxed mb-10 max-w-lg">
                  Need a different size? Want to know if we have something specific?
                  We&apos;re a message away.
                </p>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-[#25D366]/50 bg-[#25D366] px-7 py-4 font-mono text-[11px] tracking-[0.18em] uppercase text-white shadow-lg shadow-emerald-500/20 hover:bg-[#1ebe57] hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp Concierge
                  <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Empty state (only when zero products) ────────────────────────── */}
      {products.length === 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto h-16 w-16 rounded-full bg-white/[0.06] grid place-items-center mb-4 ring-1 ring-white/10">
              <EmptyBoxIcon className="h-7 w-7 text-white/40" />
            </div>
            <p className="font-serif text-2xl text-white">
              New collection coming soon
            </p>
            <p className="text-sm text-white/50 mt-1">
              Check back shortly — we&apos;re restocking.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TrustBadge({
  num,
  icon,
  title,
  description,
}: {
  num: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/45 flex items-center gap-3">
          <span aria-hidden="true" className="w-6 h-px bg-white/30" />
          {num} / Promise
        </span>
        <div className="text-white/85">{icon}</div>
      </div>
      <h3 className="font-serif text-2xl sm:text-3xl leading-tight text-white text-balance">
        {title}
      </h3>
      <p className="text-sm sm:text-[15px] text-white/55 leading-relaxed max-w-sm">
        {description}
      </p>
    </div>
  )
}
