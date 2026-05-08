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
import { HeroSlider, type HeroSlide } from './_components/hero-slider'
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

const formatPrice = (n: number) =>
  n.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  })

export default async function StorefrontHomePage({ params }: Props) {
  const store = await getPublicStore(params.storeSlug)
  if (!store) notFound()

  // Fetch enough products to power: hero (5), featured grid (8), lookbook (6).
  const [{ products, total }, categories] = await Promise.all([
    getPublicProducts(store.id, { page: 1, limit: 12 }),
    getPublicCategories(store.id),
  ])

  const whatsAppUrl = buildStoreWhatsAppUrl(store)
  // (logoUrl/StorefrontLogo are still rendered by the layout's header.)
  // Reserved for future use; currently unused on this page.
  void getStoreLogoUrl

  // Derived: hero slides from real products that have an image
  const heroSlides: HeroSlide[] = products
    .filter((p) => p.imageUrl)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      href: `/${store.slug}/products/${p.id}`,
      imageUrl: p.imageUrl as string,
      name: p.name,
      price: formatPrice(p.price),
      brand: p.brand?.name ?? null,
      category: p.category,
    }))

  // Featured grid uses up to 8 of the latest products
  const featured = products.slice(0, 8)

  return (
    <div>
      {/* ── Hero carousel (real products) ────────────────────────────────── */}
      <HeroSlider
        slides={heroSlides}
        storeSlug={store.slug}
        storeName={store.name}
        total={total}
        whatsAppUrl={whatsAppUrl}
      />

      {/* ── Trust badges ─────────────────────────────────────────────────── */}
      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-slate-100">
          <Reveal delay={0}>
            <TrustBadge
              icon={<WhatsAppIcon className="h-5 w-5 text-[#25D366]" />}
              title="WhatsApp orders"
              description="One tap. No checkout, no account."
            />
          </Reveal>
          <Reveal delay={120}>
            <TrustBadge
              icon={<BoltIcon className="h-5 w-5 text-amber-500" />}
              title="Fast response"
              description="We reply within minutes during business hours."
            />
          </Reveal>
          <Reveal delay={240}>
            <TrustBadge
              icon={<CheckBadgeIcon className="h-5 w-5 text-emerald-500" />}
              title="Live stock"
              description="Real-time inventory — no surprises after you order."
            />
          </Reveal>
        </div>
      </section>

      {/* ── Featured products ────────────────────────────────────────────── */}
      <FeaturedProducts products={featured} storeSlug={store.slug} />

      {/* ── Cinematic lookbook (real product imagery) ───────────────────── */}
      <LookbookSection products={products} storeSlug={store.slug} />

      {/* ── Categories ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Reveal>
            <div className="mb-8 sm:mb-12">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
                Browse
              </p>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Shop by category
              </h2>
            </div>
          </Reveal>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat, idx) => (
              <Reveal key={cat} delay={idx * 50} variant="scale">
                <Link
                  href={`/${store.slug}/products?category=${encodeURIComponent(cat)}`}
                  className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-900 hover:text-white hover:-translate-y-0.5 px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:shadow-lg transition-all"
                >
                  {cat}
                  <ArrowRightIcon className="h-3.5 w-3.5 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── WhatsApp CTA strip ───────────────────────────────────────────── */}
      {whatsAppUrl && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
          <Reveal variant="scale">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white px-6 sm:px-12 py-12 sm:py-20 relative overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-amber-400/30 blur-3xl motion-safe:animate-sf-orb-1"
              />
              <div
                aria-hidden="true"
                className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl motion-safe:animate-sf-orb-2"
              />

              <div className="relative max-w-2xl">
                <h3 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
                  Have a question?
                </h3>
                <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                  Need a different size? Want to know if we have something specific?
                  We&apos;re a message away.
                </p>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white px-7 py-4 text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Message us on WhatsApp
                  <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Empty state (only when zero products) ────────────────────────── */}
      {products.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-stone-100 grid place-items-center mb-4">
            <EmptyBoxIcon className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-base font-semibold text-slate-900">
            New collection coming soon
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Check back shortly — we&apos;re restocking.
          </p>
        </section>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TrustBadge({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4 px-4 sm:px-8 py-8">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-100 ring-1 ring-slate-200/60">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
