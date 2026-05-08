import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPublicStore, getPublicProduct } from '@/lib/storefront/storefront.service'

export const dynamic = 'force-dynamic'

// Strips +, spaces, dashes, parens — wa.me requires digits only.
function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

function buildWhatsAppOrderUrl(
  store: { name: string; phone: string | null },
  product: { name: string; sku: string; price: number },
): string {
  const digits = normalizePhoneForWhatsApp(store.phone ?? '')
  const message = `Hello ${store.name}, I'd like to order:\n\n• ${product.name}\n• SKU: ${product.sku}\n• Price: ${product.price.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 })}\n\nIs this still available?`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

type Props = {
  params: { storeSlug: string; productId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getPublicStore(params.storeSlug)
  if (!store) return {}
  const product = await getPublicProduct(store.id, params.productId)
  if (!product) return {}
  return {
    title: `${product.name} — ${store.name}`,
    description: product.description ?? undefined,
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

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link href={`/${store.slug}`} className="hover:text-slate-600 transition-colors">
          {store.name}
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100">
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
            <div className="w-full h-full flex items-center justify-center">
              <svg className="h-20 w-20 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Brand + Category */}
          <div className="flex items-center gap-3 mb-2">
            {product.brand && (
              <span className="text-sm font-medium text-slate-500">{product.brand.name}</span>
            )}
            {product.category && (
              <>
                {product.brand && <span className="text-slate-300">·</span>}
                <Link
                  href={`/${store.slug}?category=${encodeURIComponent(product.category)}`}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {product.category}
                </Link>
              </>
            )}
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">{product.name}</h1>

          {/* Price */}
          <p className="text-3xl font-bold text-slate-900 mb-4">
            {product.price.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 })}
          </p>

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-6">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-400'}`} />
              {inStock ? `In stock (${product.totalStock} units)` : 'Out of stock'}
            </span>
          </div>

          {/* WhatsApp order button */}
          {store.phone && (
            <a
              href={buildWhatsAppOrderUrl(store, product)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-sm transition-colors mb-6 ${
                inStock
                  ? 'bg-[#25D366] hover:bg-[#1ebe57] text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
              }`}
              aria-disabled={!inStock}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
              </svg>
              {inStock ? 'Order on WhatsApp' : 'Currently unavailable'}
            </a>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-3">Available sizes</p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s) => (
                  <span
                    key={s.size}
                    className="px-3 py-1.5 rounded-lg border-2 border-slate-900 text-sm font-medium text-slate-900"
                    title={`${s.quantity} in stock`}
                  >
                    {s.size}
                  </span>
                ))}
                {outOfStockSizes.map((s) => (
                  <span
                    key={s.size}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-300 line-through cursor-not-allowed"
                    title="Out of stock"
                  >
                    {s.size}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-6 border-t border-slate-100 pt-6">
              <p className="text-sm font-medium text-slate-700 mb-2">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* SKU */}
          <p className="text-xs text-slate-400 mt-auto pt-4 border-t border-slate-100">
            SKU: {product.sku}
          </p>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-12">
        <Link
          href={`/${store.slug}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {store.name}
        </Link>
      </div>
    </div>
  )
}
