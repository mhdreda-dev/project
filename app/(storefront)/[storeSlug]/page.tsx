import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getPublicStore,
  getPublicProducts,
  getPublicCategories,
} from '@/lib/storefront/storefront.service'
import { buildStoreWhatsAppUrl } from '@/lib/storefront/whatsapp'
import { getStoreLogoUrl } from '@/lib/storefront/logos'
import { ProductCard } from './_components/product-card'
import { Reveal } from './_components/reveal'
import { StorefrontLogo } from './_components/storefront-logo'
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

  const [{ products, total }, categories] = await Promise.all([
    getPublicProducts(store.id, { page: 1, limit: 8 }),
    getPublicCategories(store.id),
  ])

  const whatsAppUrl = buildStoreWhatsAppUrl(store)
  const logoUrl = getStoreLogoUrl(store.slug)

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-stone-50 to-amber-50/30">
        {/* Animated background orbs */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-amber-200/50 to-rose-200/40 blur-3xl motion-safe:animate-sf-orb-1" />
          <div className="absolute top-1/3 -right-24 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-emerald-200/40 to-sky-200/40 blur-3xl motion-safe:animate-sf-orb-2" />
          <div
            className="absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgb(15 23 42 / 0.08) 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Animated logo reveal */}
            <div className="motion-safe:animate-sf-fade-in mb-8 sm:mb-10" style={{ animationDelay: '0ms' }}>
              <StorefrontLogo
                storeName={store.name}
                src={logoUrl}
                variant="hero"
                size="xl"
                animate
                reveal
              />
            </div>

            <p
              className="motion-safe:animate-sf-fade-up inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur mb-6 shadow-sm"
              style={{ animationDelay: '120ms' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {total} {total === 1 ? 'product' : 'products'} available now
            </p>

            <h1
              className="motion-safe:animate-sf-fade-up text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.02]"
              style={{ animationDelay: '240ms' }}
            >
              {store.name}
            </h1>
            <p
              className="motion-safe:animate-sf-fade-up text-slate-500 font-medium mt-4 text-xl sm:text-2xl lg:text-3xl tracking-tight"
              style={{ animationDelay: '360ms' }}
            >
              Crafted for those who notice the details.
            </p>

            <p
              className="motion-safe:animate-sf-fade-up mt-6 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed"
              style={{ animationDelay: '480ms' }}
            >
              Browse the latest collection. Order in seconds — no checkout, no signup.
              Send a message and we&apos;ll take it from there.
            </p>

            <div
              className="motion-safe:animate-sf-fade-up mt-10 flex flex-wrap items-center justify-center gap-3"
              style={{ animationDelay: '600ms' }}
            >
              <Link
                href={`/${store.slug}/products`}
                className="group inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white px-7 py-4 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5 transition-all"
              >
                Shop the collection
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

        {/* Soft fade to next section */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white pointer-events-none" />
      </section>

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
      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Reveal>
            <div className="flex items-end justify-between gap-4 mb-8 sm:mb-12">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">New arrivals</p>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">Latest products</h2>
              </div>
              <Link
                href={`/${store.slug}/products`}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 group transition-colors"
              >
                View all
                <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {products.map((product, idx) => (
              <Reveal key={product.id} delay={idx * 70} variant="up">
                <ProductCard
                  product={product}
                  href={`/${store.slug}/products/${product.id}`}
                />
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-10 sm:hidden">
              <Link
                href={`/${store.slug}/products`}
                className="block w-full text-center rounded-full bg-slate-900 text-white py-4 text-sm font-semibold"
              >
                View all products
              </Link>
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Categories ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
          <Reveal>
            <div className="mb-8 sm:mb-12">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Browse</p>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">Shop by category</h2>
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

      {/* ── CTA strip ────────────────────────────────────────────────────── */}
      {whatsAppUrl && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
          <Reveal variant="scale">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white px-6 sm:px-12 py-12 sm:py-20 relative overflow-hidden">
              {/* dot pattern */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
              />
              {/* glow orbs */}
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

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {products.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-stone-100 grid place-items-center mb-4">
            <EmptyBoxIcon className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-base font-semibold text-slate-900">New collection coming soon</p>
          <p className="text-sm text-slate-500 mt-1">Check back shortly — we&apos;re restocking.</p>
        </section>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TrustBadge({
  icon, title, description,
}: { icon: React.ReactNode; title: string; description: string }) {
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
