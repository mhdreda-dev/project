import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPublicStore, getPublicProduct } from '@/lib/storefront/storefront.service'
import { buildProductWhatsAppUrl } from '@/lib/storefront/whatsapp'

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
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 sm:mb-8 overflow-hidden" aria-label="Breadcrumb">
          <Link href={`/${store.slug}`} className="hover:text-slate-700 transition shrink-0">{store.name}</Link>
          <span>/</span>
          <Link href={`/${store.slug}/products`} className="hover:text-slate-700 transition shrink-0">Products</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-100 ring-1 ring-slate-200/60 shadow-sm">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <svg className="h-20 w-20 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm grid place-items-center">
                  <span className="rounded-full bg-slate-900 text-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
                    Out of stock
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {/* Brand + Category labels */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {product.brand && (
                <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                  {product.brand.name}
                </span>
              )}
              {product.brand && product.category && <span className="text-slate-300">·</span>}
              {product.category && (
                <Link
                  href={`/${store.slug}/products?category=${encodeURIComponent(product.category)}`}
                  className="text-xs uppercase tracking-widest text-slate-400 hover:text-slate-700 transition"
                >
                  {product.category}
                </Link>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              {product.name}
            </h1>

            <p className="text-3xl font-bold text-slate-900 mb-5 tracking-tight">
              {formattedPrice}
            </p>

            <div className="flex items-center gap-2 mb-8">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                inStock
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
                  : 'bg-red-50 text-red-700 ring-1 ring-red-200/70'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {inStock ? `${product.totalStock} in stock` : 'Currently unavailable'}
              </span>
            </div>

            {/* Sizes */}
            {product.sizes.length > 0 && (
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
                      className="aspect-square rounded-xl border-2 border-slate-900 bg-white grid place-items-center text-sm font-semibold text-slate-900 hover:bg-slate-900 hover:text-white transition cursor-default select-none"
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
            )}

            {/* Desktop WhatsApp CTA */}
            {whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden lg:inline-flex items-center justify-center gap-2.5 w-full rounded-full px-6 py-4 text-sm font-semibold mb-3 transition ${
                  inStock
                    ? 'bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                }`}
                aria-disabled={!inStock}
              >
                <WhatsAppIcon className="h-5 w-5" />
                {inStock ? `Order ${formattedPrice} on WhatsApp` : 'Currently unavailable'}
              </a>
            )}
            {whatsAppUrl && (
              <p className="hidden lg:block text-xs text-slate-500 text-center mb-8">
                No checkout, no signup. We reply within minutes.
              </p>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mb-8 pt-6 border-t border-slate-200/80">
              <Trust icon={<BoltIcon className="h-4 w-4" />} label="Fast reply" />
              <Trust icon={<CheckBadgeIcon className="h-4 w-4" />} label="Live stock" />
              <Trust icon={<WhatsAppIcon className="h-4 w-4" />} label="1-tap order" />
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t border-slate-200/80 pt-6">
                <p className="text-sm font-semibold text-slate-900 mb-3">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-6 pt-6 border-t border-slate-200/80">
              SKU · {product.sku}
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-12 sm:mt-16">
          <Link
            href={`/${store.slug}/products`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to all products
          </Link>
        </div>
      </div>

      {/* Mobile fixed bottom CTA */}
      {whatsAppUrl && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md p-3 shadow-[0_-4px_24px_-12px_rgb(0_0_0_/_0.1)]">
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 w-full rounded-full px-5 py-3.5 text-sm font-semibold transition ${
              inStock
                ? 'bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-lg shadow-emerald-500/30'
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-stone-50 ring-1 ring-slate-200/60 p-3 text-center">
      <div className="text-slate-700">{icon}</div>
      <p className="text-[11px] font-medium text-slate-600 leading-tight">{label}</p>
    </div>
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
