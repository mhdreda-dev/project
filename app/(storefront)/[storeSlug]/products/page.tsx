import { notFound } from 'next/navigation'
import {
  getPublicStore,
  getPublicProducts,
  getPublicCategories,
} from '@/lib/storefront/storefront.service'
import { ProductCard } from '../_components/product-card'

export const dynamic = 'force-dynamic'

type Props = {
  params: { storeSlug: string }
  searchParams: { category?: string; search?: string; page?: string }
}

export default async function ProductsCatalogPage({ params, searchParams }: Props) {
  const store = await getPublicStore(params.storeSlug)
  if (!store) notFound()

  const category = searchParams.category ?? undefined
  const search = searchParams.search ?? undefined
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getPublicProducts(store.id, { category, search, page, limit: 24 }),
    getPublicCategories(store.id),
  ])

  const baseUrl = `/${store.slug}/products`

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">All products</h1>

      <div className="mb-8 space-y-4">
        <form method="GET" className="flex gap-3">
          <input
            type="text"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Search products…"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
          {category && <input type="hidden" name="category" value={category} />}
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Search
          </button>
          {(search || category) && (
            <a
              href={baseUrl}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Clear
            </a>
          )}
        </form>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <a
              href={search ? `${baseUrl}?search=${encodeURIComponent(search)}` : baseUrl}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                !category
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </a>
            {categories.map((cat) => {
              const qp = new URLSearchParams()
              qp.set('category', cat)
              if (search) qp.set('search', search)
              return (
                <a
                  key={cat}
                  href={`${baseUrl}?${qp.toString()}`}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    category === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </a>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">
          {total === 0
            ? 'No products found'
            : `${total} product${total !== 1 ? 's' : ''}${category ? ` in "${category}"` : ''}${search ? ` for "${search}"` : ''}`}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <svg className="mx-auto mb-4 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-lg font-medium">No products available</p>
          {(search || category) && (
            <a href={baseUrl} className="mt-3 inline-block text-sm text-slate-600 underline">
              Clear filters
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              href={`/${store.slug}/products/${product.id}`}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const qp = new URLSearchParams()
            qp.set('page', String(p))
            if (category) qp.set('category', category)
            if (search) qp.set('search', search)
            return (
              <a
                key={p}
                href={`${baseUrl}?${qp.toString()}`}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
