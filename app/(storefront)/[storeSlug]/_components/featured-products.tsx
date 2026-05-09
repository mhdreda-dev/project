import Link from 'next/link'
import { ProductCard, type StorefrontProduct } from './product-card'
import { Reveal } from './reveal'
import { ArrowRightIcon } from './icons'

type Props = {
  products: StorefrontProduct[]
  storeSlug: string
  /** Optional override for the section eyebrow + heading. */
  eyebrow?: string
  /** Optional volume code shown alongside the eyebrow (e.g. "02 — New arrivals"). */
  volumeCode?: string
  heading?: string
  /** Optional italic accent word inside the heading. */
  headingAccent?: string
}

export function FeaturedProducts({
  products,
  storeSlug,
  eyebrow = 'New arrivals',
  volumeCode = '02',
  heading = 'Latest products',
  headingAccent = 'products',
}: Props) {
  if (products.length === 0) return null

  const accentIdx = headingAccent ? heading.lastIndexOf(headingAccent) : -1

  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-amber-400/[0.07] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute right-0 bottom-0 h-[30rem] w-[30rem] rounded-full bg-emerald-300/[0.04] blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex items-end justify-between gap-6 mb-12 sm:mb-16">
            <div className="min-w-0">
              <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-amber-200/70 font-semibold mb-5 flex items-center gap-3">
                <span aria-hidden="true" className="w-6 h-px bg-amber-200/45" />
                <span>
                  {volumeCode} / {eyebrow}
                </span>
              </p>
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl leading-[1.05] text-white text-balance">
                {accentIdx >= 0 ? (
                  <>
                    {heading.slice(0, accentIdx)}
                    <em className="italic font-light text-amber-200/90">{headingAccent}</em>
                    {heading.slice(accentIdx + headingAccent.length)}
                  </>
                ) : (
                  heading
                )}
              </h2>
            </div>
            <Link
              href={`/${storeSlug}/products`}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 font-mono text-[10px] tracking-[0.28em] uppercase text-white/65 backdrop-blur hover:border-amber-200/40 hover:bg-white/[0.08] hover:text-white group transition-all shrink-0"
            >
              View all
              <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:gap-x-8">
          {products.map((product, idx) => (
            <Reveal key={product.id} delay={Math.min(idx * 60, 360)} variant="up">
              <ProductCard
                product={product}
                href={`/${storeSlug}/products/${product.id}`}
                tone="dark"
              />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 sm:hidden">
            <Link
              href={`/${storeSlug}/products`}
              className="group flex w-full items-center justify-center gap-2 rounded-full border border-amber-100/30 bg-amber-100 py-4 font-mono text-[11px] tracking-[0.22em] uppercase text-stone-950 shadow-2xl shadow-black/25"
            >
              View all products
              <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
