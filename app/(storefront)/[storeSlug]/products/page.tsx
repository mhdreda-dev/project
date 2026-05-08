import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getPublicStore,
  getPublicProducts,
  getPublicCategories,
} from '@/lib/storefront/storefront.service'
import { ProductCard } from '../_components/product-card'
import { Reveal } from '../_components/reveal'
import { SearchIcon } from '../_components/icons'

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
  const hasFilters = !!(category || search)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Page header */}
      <div className="mb-10 sm:mb-12 motion-safe:animate-sf-fade-up">
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-4" aria-label="Breadcrumb">
          <Link href={`/${store.slug}`} className="hover:text-slate-700 transition-colors">{store.name}</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">{category ?? 'Products'}</span>
        </nav>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
          {category ?? 'All products'}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {total === 0
            ? 'No products match your filters'
            : `${total} ${total === 1 ? 'product' : 'products'}${search ? ` matching "${search}"` : ''}`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-8 sm:mb-12 space-y-4 motion-safe:animate-sf-fade-up" style={{ animationDelay: '120ms' }}>
        <form method="GET" className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="Search products…"
              className="w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>
          {category && <input type="hidden" name="category" value={category} />}
          <button
            type="submit"
            className="rounded-full bg-slate-900 hover:bg-slate-800 text-white px-5 sm:px-6 py-3 text-sm font-semibold shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Search
          </button>
          {hasFilters && (
            <a
              href={baseUrl}
              className="hidden sm:inline-flex items-center rounded-full border border-slate-200 hover:border-slate-300 bg-white text-slate-600 px-5 py-3 text-sm font-medium shadow-sm transition"
            >
              Clear
            </a>
          )}
        </form>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:-mx-0 sm:px-0 sm:flex-wrap pb-1 scrollbar-hide">
            <CategoryPill
              href={search ? `${baseUrl}?search=${encodeURIComponent(search)}` : baseUrl}
              active={!category}
            >
              All products
            </CategoryPill>
            {categories.map((cat) => {
              const qp = new URLSearchParams()
              qp.set('category', cat)
              if (search) qp.set('search', search)
              return (
                <CategoryPill key={cat} href={`${baseUrl}?${qp.toString()}`} active={category === cat}>
                  {cat}
                </CategoryPill>
              )
            })}
          </div>
        )}
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <Reveal variant="scale">
          <div className="rounded-3xl bg-white border border-dashed border-slate-200 px-6 py-20 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-stone-100 grid place-items-center mb-4">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-900 mb-1">No products found</p>
            <p className="text-sm text-slate-500 mb-6">
              {hasFilters
                ? 'Try adjusting your filters or search terms.'
                : 'Check back soon for new arrivals.'}
            </p>
            {hasFilters && (
              <a
                href={baseUrl}
                className="inline-flex items-center rounded-full bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
              >
                Clear filters
              </a>
            )}
          </div>
        </Reveal>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product, idx) => (
            <Reveal key={product.id} delay={Math.min(idx * 40, 400)} variant="up">
              <ProductCard
                product={product}
                href={`/${store.slug}/products/${product.id}`}
              />
            </Reveal>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Reveal>
          <nav
            className="mt-12 sm:mt-16 flex justify-center items-center gap-2 flex-wrap"
            aria-label="Pagination"
          >
            {page > 1 && (
              <PageLink baseUrl={baseUrl} page={page - 1} category={category} search={search}>
                ← Previous
              </PageLink>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PageLink key={p} baseUrl={baseUrl} page={p} category={category} search={search} active={p === page}>
                {p}
              </PageLink>
            ))}
            {page < totalPages && (
              <PageLink baseUrl={baseUrl} page={page + 1} category={category} search={search}>
                Next →
              </PageLink>
            )}
          </nav>
        </Reveal>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CategoryPill({
  href, active, children,
}: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap shrink-0 shadow-sm transition-all ${
        active
          ? 'bg-slate-900 text-white scale-105'
          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900 hover:-translate-y-0.5'
      }`}
    >
      {children}
    </a>
  )
}

function PageLink({
  baseUrl, page, category, search, active = false, children,
}: {
  baseUrl: string
  page: number
  category?: string
  search?: string
  active?: boolean
  children: React.ReactNode
}) {
  const qp = new URLSearchParams()
  qp.set('page', String(page))
  if (category) qp.set('category', category)
  if (search) qp.set('search', search)
  return (
    <a
      href={`${baseUrl}?${qp.toString()}`}
      aria-current={active ? 'page' : undefined}
      className={`min-w-[2.5rem] h-10 px-3 rounded-full inline-flex items-center justify-center text-sm font-semibold shadow-sm transition-all ${
        active
          ? 'bg-slate-900 text-white scale-105'
          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900 hover:-translate-y-0.5'
      }`}
    >
      {children}
    </a>
  )
}
