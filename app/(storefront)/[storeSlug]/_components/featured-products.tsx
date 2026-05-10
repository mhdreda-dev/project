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
  variant?: 'default' | 'benami'
}

export function FeaturedProducts({
  products,
  storeSlug,
  eyebrow = 'New arrivals',
  volumeCode = '02',
  heading = 'Latest products',
  headingAccent = 'products',
  variant = 'default',
}: Props) {
  if (products.length === 0) return null

  const accentIdx = headingAccent ? heading.lastIndexOf(headingAccent) : -1
  const isBenami = variant === 'benami'

  return (
    <section className={`relative overflow-hidden ${isBenami ? 'py-12 sm:py-20 lg:py-24' : 'py-14 sm:py-24 lg:py-28'}`}>
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
          <div className={`${isBenami ? 'mb-8 sm:mb-11' : 'mb-9 sm:mb-14'} flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between`}>
            <div className="min-w-0">
              <p className="mb-4 flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/70 sm:mb-5 sm:text-[11px]">
                <span aria-hidden="true" className="w-6 h-px bg-amber-200/45" />
                <span>
                  {volumeCode} / {eyebrow}
                </span>
              </p>
              <h2 className={`font-serif leading-[1.05] text-white text-balance ${isBenami ? 'text-[2rem] sm:text-5xl lg:text-[3.75rem]' : 'text-3xl sm:text-5xl lg:text-6xl'}`}>
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
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                {isBenami
                  ? 'Sneakers, essentials, and fresh arrivals with live stock status and direct WhatsApp ordering.'
                  : 'A refined edit of the newest pieces in stock, selected for quick browsing and direct WhatsApp ordering.'}
              </p>
            </div>
            <Link
              href={`/${storeSlug}/products`}
              className="hidden shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.055] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-amber-200/40 hover:bg-white/[0.09] hover:text-white sm:inline-flex"
            >
              Voir tout
              <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>

        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${isBenami ? 'gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-10 lg:gap-x-6 xl:gap-x-7' : 'gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-11 lg:gap-x-6 xl:gap-x-8'}`}>
          {products.map((product, idx) => (
            <Reveal key={product.id} delay={Math.min(idx * 60, 360)} variant="up">
              <ProductCard
                product={product}
                href={`/${storeSlug}/products/${product.id}`}
                tone="dark"
                presentation={isBenami ? 'benami' : 'default'}
              />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 sm:hidden">
            <Link
              href={`/${storeSlug}/products`}
              className="group flex w-full items-center justify-center gap-2 rounded-full border border-amber-100/30 bg-amber-100 py-4 font-mono text-[11px] uppercase tracking-[0.22em] text-stone-950 shadow-2xl shadow-black/25"
            >
              Voir les produits
              <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
