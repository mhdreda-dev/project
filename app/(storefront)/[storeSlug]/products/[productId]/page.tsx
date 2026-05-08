import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPublicStore, getPublicProduct } from '@/lib/storefront/storefront.service'
import { buildProductWhatsAppUrl } from '@/lib/storefront/whatsapp'
import { Reveal } from '../../_components/reveal'
import {
  ArrowLeftIcon,
  BoltIcon,
  CheckBadgeIcon,
  ImagePlaceholderIcon,
  WhatsAppIcon,
} from '../../_components/icons'

export const dynamic = 'force-dynamic'

type Props = {
  params: { storeSlug: string; productId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getPublicStore(params.storeSlug)
  if (!store) return {}
  const product = await getPublicProduct(store.id, params.productId)
  if (!product) return {}
  return {
    title: product.name,
    description: product.description ?? `${product.name} at ${store.name}`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const store = await getPublicStore(params.storeSlug)
  if (!store) notFound()

  const product = await getPublicProduct(store.id, params.productId)
  if (!product) notFound()

  const inStock = product.totalStock > 0
  const availableSizes = product.sizes.filter((s) => s.quantity > 0)
  const outOfStockSizes = product.sizes.filter((s) => s.quantity === 0)
  const whatsAppUrl = buildProductWhatsAppUrl(store, product)
  const formattedPrice = product.price.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  })

  return (
    <div className="pb-24 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav
          className="motion-safe:animate-sf-fade-in flex items-center gap-2 text-xs text-slate-400 mb-6 sm:mb-8 overflow-hidden"
          aria-label="Breadcrumb"
        >
          <Link href={`/${store.slug}`} className="hover:text-slate-700 transition-colors shrink-0">{store.name}</Link>
          <span>/</span>
          <Link href={`/${store.slug}/products`} className="hover:text-slate-700 transition-colors shrink-0">Products</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* ── Image ───────────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-32 lg:self-start motion-safe:animate-sf-scale-in">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-100 ring-1 ring-slate-200/60 shadow-sm group">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <ImagePlaceholderIcon className="h-20 w-20 text-slate-300" />
                </div>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm grid place-items-center">
                  <span className="rounded-full bg-slate-900 text-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest motion-safe:animate-sf-bounce-in">
                    Out of stock
                  </span>
                </div>
              )}

              {/* Subtle radial highlight */}
              <div
                aria-hidden="true"
                className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/40 blur-3xl pointer-events-none"
              />
            </div>
          </div>

          {/* ── Details ──────────────────────────────────────────────────── */}
          <div className="flex flex-col">
            {/* Brand + Category labels */}
            <div
              className="motion-safe:animate-sf-fade-up flex items-center gap-2 flex-wrap mb-3"
              style={{ animationDelay: '80ms' }}
            >
              {product.brand && (
                <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                  {product.brand.name}
                </span>
              )}
              {product.brand && product.category && <span className="text-slate-300">·</span>}
              {product.category && (
                <Link
                  href={`/${store.slug}/products?category=${encodeURIComponent(product.category)}`}
                  className="text-xs uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {product.category}
                </Link>
              )}
            </div>

            <h1
              className="motion-safe:animate-sf-fade-up text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4 leading-tight"
              style={{ animationDelay: '160ms' }}
            >
              {product.name}
            </h1>

            <p
              className="motion-safe:animate-sf-fade-up text-3xl font-bold text-slate-900 mb-5 tracking-tight"
              style={{ animationDelay: '240ms' }}
            >
              {formattedPrice}
            </p>

            <div
              className="motion-safe:animate-sf-fade-up flex items-center gap-2 mb-8"
              style={{ animationDelay: '320ms' }}
            >
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  inStock
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
                    : 'bg-red-50 text-red-700 ring-1 ring-red-200/70'
                }`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping ${
                      inStock ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                      inStock ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                </span>
                {inStock ? `${product.totalStock} in stock` : 'Currently unavailable'}
              </span>
            </div>

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <Reveal delay={50}>
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-900">Available sizes</p>
                    <p className="text-xs text-slate-400">
                      {availableSizes.length} of {product.sizes.length} in stock
                    </p>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    {availableSizes.map((s) => (
                      <div
                        key={s.size}
                        className="aspect-square rounded-xl border-2 border-slate-900 bg-white grid place-items-center text-sm font-semibold text-slate-900 hover:bg-slate-900 hover:text-white hover:-translate-y-0.5 hover:shadow-md transition-all cursor-default select-none"
                        title={`${s.quantity} in stock`}
                      >
                        {s.size}
                      </div>
                    ))}
                    {outOfStockSizes.map((s) => (
                      <div
                        key={s.size}
                        className="aspect-square rounded-xl border border-slate-200 bg-stone-50 grid place-items-center text-sm font-medium text-slate-300 line-through cursor-not-allowed select-none"
                        title="Out of stock"
                      >
                        {s.size}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Desktop WhatsApp CTA */}
            {whatsAppUrl && (
              <Reveal delay={120} className="hidden lg:block">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group inline-flex items-center justify-center gap-2.5 w-full rounded-full px-6 py-4 text-sm font-semibold mb-3 transition-all ${
                    inStock
                      ? 'bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                  }`}
                  aria-disabled={!inStock}
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  {inStock ? `Order ${formattedPrice} on WhatsApp` : 'Currently unavailable'}
                </a>
                <p className="text-xs text-slate-500 text-center mb-8">
                  No checkout, no signup. We reply within minutes.
                </p>
              </Reveal>
            )}

            {/* Trust badges */}
            <Reveal delay={180}>
              <div className="grid grid-cols-3 gap-3 mb-8 pt-6 border-t border-slate-200/80">
                <Trust icon={<BoltIcon className="h-4 w-4" />} label="Fast reply" />
                <Trust icon={<CheckBadgeIcon className="h-4 w-4" />} label="Live stock" />
                <Trust icon={<WhatsAppIcon className="h-4 w-4" />} label="1-tap order" />
              </div>
            </Reveal>

            {/* Description */}
            {product.description && (
              <Reveal delay={240}>
                <div className="border-t border-slate-200/80 pt-6">
                  <p className="text-sm font-semibold text-slate-900 mb-3">Description</p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              </Reveal>
            )}

            <p className="text-xs text-slate-400 mt-6 pt-6 border-t border-slate-200/80">
              SKU · {product.sku}
            </p>
          </div>
        </div>

        {/* Back link */}
        <Reveal>
          <div className="mt-12 sm:mt-16">
            <Link
              href={`/${store.slug}/products`}
              className="group inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to all products
            </Link>
          </div>
        </Reveal>
      </div>

      {/* ── Mobile fixed bottom CTA ─────────────────────────────────────── */}
      {whatsAppUrl && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md p-3 shadow-[0_-4px_24px_-12px_rgb(0_0_0_/_0.15)] motion-safe:animate-sf-fade-up">
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 w-full rounded-full px-5 py-3.5 text-sm font-semibold transition-all ${
              inStock
                ? 'bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-lg shadow-emerald-500/30 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
            }`}
            aria-disabled={!inStock}
          >
            <WhatsAppIcon className="h-5 w-5" />
            {inStock ? `Order ${formattedPrice} on WhatsApp` : 'Currently unavailable'}
          </a>
        </div>
      )}
    </div>
  )
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-stone-50 ring-1 ring-slate-200/60 p-3 text-center hover:ring-slate-300 hover:-translate-y-0.5 transition-all">
      <div className="text-slate-700">{icon}</div>
      <p className="text-[11px] font-medium text-slate-600 leading-tight">{label}</p>
    </div>
  )
}
