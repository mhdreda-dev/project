import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicStore, getPublicProducts } from '@/lib/storefront/storefront.service'
import { ProductCard } from './_components/product-card'

export const dynamic = 'force-dynamic'

type Props = {
  params: { storeSlug: string }
}

export default async function StorefrontHomePage({ params }: Props) {
  const store = await getPublicStore(params.storeSlug)
  if (!store) notFound()

  const { products, total } = await getPublicProducts(store.id, { page: 1, limit: 8 })

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12 lg:py-20 bg-slate-50 rounded-2xl">
        <h1 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4">
          Welcome to {store.name}
        </h1>
        <p className="text-base lg:text-lg text-slate-500 mb-8 max-w-xl mx-auto">
          Browse our latest collection. {total > 0 && `${total} product${total !== 1 ? 's' : ''} available.`}
        </p>
        <Link
          href={`/${store.slug}/products`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Shop all products
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </section>

      {/* Featured products */}
      {products.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-semibold text-slate-900">Latest products</h2>
            <Link
              href={`/${store.slug}/products`}
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/${store.slug}/products/${product.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {products.length === 0 && (
        <section className="text-center py-16 text-slate-400">
          <p className="text-base">No products yet. Check back soon!</p>
        </section>
      )}
    </div>
  )
}
