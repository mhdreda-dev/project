import Link from 'next/link'
import { ProductCard, type StorefrontProduct } from './product-card'
import { Reveal } from './reveal'
import { ArrowRightIcon } from './icons'

type Props = {
  products: StorefrontProduct[]
  storeSlug: string
  title: string
  eyebrow: string
  description: string
  viewAllLabel: string
}

export function RelatedProducts({
  products,
  storeSlug,
  title,
  eyebrow,
  description,
  viewAllLabel,
}: Props) {
  if (products.length === 0) return null

  return (
    <section className="relative overflow-hidden border-t border-white/10 py-16 text-white sm:py-24 lg:py-28">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 to-transparent" />
      <div aria-hidden="true" className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-amber-300/[0.07] blur-3xl" />
      <div aria-hidden="true" className="absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-emerald-300/[0.045] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-9 flex flex-col gap-5 sm:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-4 flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/70 sm:text-[11px]">
                <span aria-hidden="true" className="h-px w-6 bg-amber-200/45" />
                <span>{eyebrow}</span>
              </p>
              <h2 className="font-serif text-3xl leading-[1.05] text-white text-balance sm:text-5xl lg:text-6xl">
                {title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-white/58 sm:text-base">
                {description}
              </p>
            </div>

            <Link
              href={`/${storeSlug}/products`}
              className="hidden shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.055] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-amber-200/40 hover:bg-white/[0.09] hover:text-white sm:inline-flex"
            >
              {viewAllLabel}
              <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-11 lg:grid-cols-4 lg:gap-x-6 xl:gap-x-8">
          {products.map((product, idx) => (
            <Reveal key={product.id} delay={Math.min(idx * 50, 350)} variant="up">
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
              className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-100/30 bg-amber-100 py-4 font-mono text-[11px] uppercase tracking-[0.22em] text-stone-950 shadow-2xl shadow-black/25"
            >
              {viewAllLabel}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
