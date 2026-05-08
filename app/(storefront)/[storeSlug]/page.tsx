import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getPublicStore,
  getPublicProducts,
  getPublicCategories,
} from '@/lib/storefront/storefront.service'
import { buildStoreWhatsAppUrl } from '@/lib/storefront/whatsapp'
import { ProductCard } from './_components/product-card'

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

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-stone-50 to-amber-50/40">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(15 23 42 / 0.08) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {total} {total === 1 ? 'product' : 'products'} available now
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
              {store.name}
              <span className="block text-slate-500 font-medium mt-3 text-2xl sm:text-3xl lg:text-4xl tracking-tight">
                Crafted for those who notice the details.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Browse the latest collection. Order in seconds — no checkout, no signup.
              Send a message and we&apos;ll take it from there.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={`/${store.slug}/products`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 text-sm font-semibold shadow-lg shadow-slate-900/10 transition"
              >
                Shop the collection
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              {whatsAppUrl && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md text-slate-900 px-6 py-3.5 text-sm font-semibold shadow-sm transition"
                >
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                  Chat with us
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-slate-100">
          <TrustBadge
            icon={<WhatsAppIcon className="h-5 w-5 text-[#25D366]" />}
            title="WhatsApp orders"
            description="One tap. No checkout, no account."
          />
          <TrustBadge
            icon={<BoltIcon className="h-5 w-5 text-amber-500" />}
            title="Fast response"
            description="We reply within minutes during business hours."
          />
          <TrustBadge
            icon={<CheckBadgeIcon className="h-5 w-5 text-emerald-500" />}
            title="Live stock"
            description="Real-time inventory — no surprises after you order."
          />
        </div>
      </section>

      {/* Featured products */}
      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">New arrivals</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Latest products</h2>
            </div>
            <Link
              href={`/${store.slug}/products`}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              View all
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/${store.slug}/products/${product.id}`}
              />
            ))}
          </div>

          <div className="mt-10 sm:hidden">
            <Link
              href={`/${store.slug}/products`}
              className="block w-full text-center rounded-full bg-slate-900 text-white py-3.5 text-sm font-semibold"
            >
              View all products
            </Link>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <div className="mb-8 sm:mb-10">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Browse</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Shop by category</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/${store.slug}/products?category=${encodeURIComponent(cat)}`}
                className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-900 hover:text-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:shadow-md transition"
              >
                {cat}
                <ArrowRightIcon className="h-3.5 w-3.5 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA strip */}
      {whatsAppUrl && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
          <div className="rounded-3xl bg-slate-900 text-white px-6 sm:px-12 py-12 sm:py-16 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" aria-hidden="true" />

            <div className="relative max-w-2xl">
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Have a question?</h3>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
                Need a different size? Want to know if we have something specific?
                We&apos;re a message away.
              </p>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white px-6 py-3.5 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Message us on WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}

      {products.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-stone-100 grid place-items-center mb-4">
            <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
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
    <div className="flex items-start gap-4 px-4 sm:px-8 py-6 sm:py-8">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
  )
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function CheckBadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
