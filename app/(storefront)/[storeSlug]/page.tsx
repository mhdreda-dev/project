import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getPublicStore,
  getPublicProducts,
  getPublicCategories,
} from '@/lib/storefront/storefront.service'
import { buildStoreWhatsAppUrl } from '@/lib/storefront/whatsapp'
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
  // Featured grid uses up to 8 of the latest products
  const featured = products.slice(0, 8)
  const isBenami = store.slug === 'benami'

  return (
    <div className="relative overflow-x-clip">
      {/* ── Editorial hero (curated visuals — NOT bound to DB products) ── */}
      <HeroSlider
        storeSlug={store.slug}
        storeName={store.name}
        heroImageUrl={store.heroImageUrl}
        whatsAppUrl={whatsAppUrl}
        exploreAnchor="featured"
        variant={isBenami ? 'benami' : 'default'}
      />

      {/* ── Trust strip — dark editorial ─────────────────────────────────── */}
      <section className={`relative overflow-hidden border-y border-white/10 text-white ${isBenami ? 'bg-[#0a0a09]/95' : 'bg-[#0b0b0a]/85'}`}>
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
        <div className={`relative mx-auto grid max-w-7xl grid-cols-1 px-4 sm:grid-cols-3 sm:px-6 lg:px-8 ${isBenami ? 'gap-3 py-6 sm:gap-3 sm:py-10 lg:py-12' : 'gap-5 py-8 sm:gap-0 sm:py-12 lg:py-16'}`}>
          <Reveal delay={0} className={isBenami ? '' : 'sm:pr-8'}>
            <TrustBadge
              num="01"
              icon={<WhatsAppIcon className="h-5 w-5 text-[#25D366]" />}
              title="WhatsApp Concierge"
              description={isBenami ? 'Order in one clear message. No account, no checkout friction.' : 'One tap. No checkout, no account. Real humans on the other end.'}
              compact={isBenami}
            />
          </Reveal>
          <Reveal delay={120} className={isBenami ? '' : 'border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:px-8 sm:pt-0'}>
            <TrustBadge
              num="02"
              icon={<BoltIcon className="h-5 w-5 text-amber-300" />}
              title="Express Reply"
              description={isBenami ? 'Quick replies during opening hours, with size and availability confirmed.' : 'Average response within minutes during business hours.'}
              compact={isBenami}
            />
          </Reveal>
          <Reveal delay={240} className={isBenami ? '' : 'border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0'}>
            <TrustBadge
              num="03"
              icon={<CheckBadgeIcon className="h-5 w-5 text-emerald-300" />}
              title="Live Inventory"
              description={isBenami ? 'Product cards show live stock signals so sold-out pairs are obvious.' : 'Real-time stock signed at the atelier — no surprises after you order.'}
              compact={isBenami}
            />
          </Reveal>
        </div>
      </section>

      {/* ── Featured products (real DB products) ─────────────────────────── */}
      <div id="featured" className="scroll-mt-20">
        <FeaturedProducts
          products={featured}
          storeSlug={store.slug}
          eyebrow="New arrivals"
          volumeCode="02"
          heading="Fresh stock, ready to order"
          headingAccent="ready"
          variant={isBenami ? 'benami' : 'default'}
        />
      </div>

      {/* ── Cinematic lookbook (real product imagery) ───────────────────── */}
      <LookbookSection products={products} storeSlug={store.slug} storeName={store.name} />

      {/* ── Categories ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className={`relative overflow-hidden text-white ${isBenami ? 'py-12 sm:py-20' : 'py-14 sm:py-24'}`}>
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
              <div className={`${isBenami ? 'mb-7 sm:mb-10' : 'mb-8 sm:mb-12'} max-w-3xl`}>
                <p className="mb-4 flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/70 sm:text-[11px]">
                  <span aria-hidden="true" className="w-6 h-px bg-amber-300/60" />
                  <span>04 / Categories</span>
                </p>
                <h2 className={`font-serif leading-[1.05] text-white text-balance ${isBenami ? 'text-[2rem] sm:text-5xl lg:text-[3.75rem]' : 'text-3xl sm:text-5xl lg:text-6xl'}`}>
                  Browse by{' '}
                  <em className="italic font-light text-amber-200/95">category</em>.
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat, idx) => (
                <Reveal key={cat} delay={idx * 50} variant="scale">
                  <Link
                    href={`/${store.slug}/products?category=${encodeURIComponent(cat)}`}
                    className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-4 text-white shadow-lg shadow-black/10 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-amber-200/45 hover:bg-white/[0.09]"
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
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] px-5 py-10 text-white shadow-2xl shadow-black/35 backdrop-blur-md sm:px-12 sm:py-20">
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
                <h3 className="mb-5 font-serif text-3xl leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
                  Ready to find your{' '}
                  <em className="italic font-light text-amber-200/95">size?</em>
                </h3>
                <p className="mb-8 max-w-lg text-base leading-relaxed text-white/65 sm:mb-10 sm:text-lg">
                  Need a different size? Want to know if we have something specific?
                  We&apos;re a message away.
                </p>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/50 bg-[#25D366] px-7 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#1ebe57] hover:shadow-xl hover:shadow-emerald-500/30 sm:w-auto"
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
  compact = false,
}: {
  num: string
  icon: React.ReactNode
  title: string
  description: string
  compact?: boolean
}) {
  return (
    <div className={`flex h-full flex-col border-white/10 ${compact ? 'gap-3 rounded-3xl border bg-white/[0.045] p-4 shadow-lg shadow-black/10 backdrop-blur-sm sm:p-5 lg:p-6' : 'gap-3 sm:gap-5'}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
          <span aria-hidden="true" className="w-6 h-px bg-white/30" />
          {num} / Promise
        </span>
        <div className="text-white/85">{icon}</div>
      </div>
      <h3 className={`font-serif leading-tight text-white text-balance ${compact ? 'text-xl sm:text-2xl' : 'text-xl sm:text-3xl'}`}>
        {title}
      </h3>
      <p className={`max-w-sm text-sm leading-relaxed text-white/60 ${compact ? 'sm:text-sm' : 'sm:text-[15px]'}`}>
        {description}
      </p>
    </div>
  )
}
