import Link from 'next/link'
import { ProductCard, type StorefrontProduct } from './product-card'
import { Reveal } from './reveal'
import { ArrowRightIcon } from './icons'

type Props = {
  products: StorefrontProduct[]
  storeSlug: string
  /** Optional override for the section eyebrow + heading. */
  eyebrow?: string
  heading?: string
}

export function FeaturedProducts({
  products,
  storeSlug,
  eyebrow = 'New arrivals',
  heading = 'Latest products',
}: Props) {
  if (products.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Reveal>
        <div className="flex items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
              {eyebrow}
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {heading}
            </h2>
          </div>
          <Link
            href={`/${storeSlug}/products`}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 group transition-colors"
          >
            View all
            <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {products.map((product, idx) => (
          <Reveal key={product.id} delay={Math.min(idx * 60, 360)} variant="up">
            <ProductCard
              product={product}
              href={`/${storeSlug}/products/${product.id}`}
            />
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-10 sm:hidden">
          <Link
            href={`/${storeSlug}/products`}
            className="block w-full text-center rounded-full bg-slate-900 text-white py-4 text-sm font-semibold"
          >
            View all products
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
