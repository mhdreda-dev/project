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
    <div className="relative overflow-hidden py-10 sm:py-14 lg:py-16">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-amber-300/[0.07] blur-3xl" />
        <div className="absolute -right-32 top-72 h-96 w-96 rounded-full bg-emerald-300/[0.05] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-10 sm:mb-12 motion-safe:animate-sf-fade-up">
        <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35 mb-5" aria-label="Breadcrumb">
          <Link href={`/${store.slug}`} className="hover:text-white/75 transition-colors">{store.name}</Link>
          <span className="text-white/20">/</span>
          <span className="text-amber-100/75">{category ?? 'Products'}</span>
        </nav>
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl leading-[1.02] text-white text-balance">
          {category ?? 'All products'}<span className="text-amber-200/90">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base text-white/55 leading-relaxed">
          {total === 0
            ? 'No products match your filters'
            : `${total} ${total === 1 ? 'product' : 'products'}${search ? ` matching "${search}"` : ''}`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-8 sm:mb-12 space-y-4 motion-safe:animate-sf-fade-up" style={{ animationDelay: '120ms' }}>
        <form method="GET" className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35 pointer-events-none" />
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="Search products…"
              className="w-full rounded-full border border-white/10 bg-white/[0.06] pl-11 pr-4 py-3 text-sm text-white placeholder-white/35 shadow-2xl shadow-black/10 backdrop-blur-md focus:outline-none focus:border-amber-200/45 focus:ring-2 focus:ring-amber-200/10 transition"
            />
          </div>
          {category && <input type="hidden" name="category" value={category} />}
          <button
            type="submit"
            className="rounded-full border border-amber-100/30 bg-amber-100 text-stone-950 px-5 sm:px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] shadow-lg shadow-amber-900/10 hover:bg-white hover:-translate-y-0.5 transition-all"
          >
            Search
          </button>
          {hasFilters && (
            <a
              href={baseUrl}
              className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 backdrop-blur transition hover:border-white/25 hover:text-white"
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
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.04] px-6 py-20 text-center backdrop-blur-md">
            <div className="mx-auto h-12 w-12 rounded-full bg-white/[0.08] grid place-items-center mb-4 ring-1 ring-white/10">
              <SearchIcon className="h-5 w-5 text-white/45" />
            </div>
            <p className="font-serif text-2xl text-white mb-1">No products found</p>
            <p className="text-sm text-white/50 mb-6">
              {hasFilters
                ? 'Try adjusting your filters or search terms.'
                : 'Check back soon for new arrivals.'}
            </p>
            {hasFilters && (
              <a
                href={baseUrl}
                className="inline-flex items-center rounded-full bg-amber-100 text-stone-950 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-white hover:-translate-y-0.5 transition-all"
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
                tone="dark"
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
      className={`inline-flex items-center rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] whitespace-nowrap shrink-0 transition-all ${
        active
          ? 'bg-amber-100 text-stone-950 scale-105'
          : 'bg-white/[0.04] border border-white/10 text-white/55 hover:border-white/30 hover:text-white hover:-translate-y-0.5'
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
      className={`min-w-[2.5rem] h-10 px-3 rounded-full inline-flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.14em] transition-all ${
        active
          ? 'bg-amber-100 text-stone-950 scale-105'
          : 'bg-white/[0.04] border border-white/10 text-white/55 hover:border-white/30 hover:text-white hover:-translate-y-0.5'
      }`}
    >
      {children}
    </a>
  )
}
