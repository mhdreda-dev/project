import Link from 'next/link'
import Image from 'next/image'
import { Reveal } from './reveal'
import { ArrowRightIcon } from './icons'
import type { StorefrontProduct } from './product-card'

type Props = {
  products: StorefrontProduct[]
  storeSlug: string
}

const formatPrice = (n: number) =>
  n.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  })

/**
 * LookbookSection — cinematic dark section showing real product imagery in a
 * horizontal editorial scroll. Each card links to the product detail page.
 * Renders nothing if there are no products with images.
 */
export function LookbookSection({ products, storeSlug }: Props) {
  const items = products.filter((p) => p.imageUrl).slice(0, 6)
  if (items.length === 0) return null

  return (
    <section className="relative overflow-hidden text-white py-20 sm:py-24 lg:py-28">
      {/* Local atmosphere only; the storefront layout owns the page background. */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/35 to-transparent" />
        <div className="absolute -top-48 left-1/2 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute bottom-0 -right-32 h-[34rem] w-[34rem] rounded-full bg-emerald-400/[0.045] blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-[28rem] w-[28rem] rounded-full bg-rose-300/[0.035] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.045] [mask-image:linear-gradient(90deg,transparent,black_16%,black_84%,transparent)]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.7) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Heading */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mb-10 sm:mb-12 lg:mb-14 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Reveal>
                <p className="mb-5 flex items-center gap-3 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-amber-200/70 font-semibold">
                  <span aria-hidden="true" className="h-px w-7 bg-amber-200/45" />
                  THE LOOKBOOK
                </p>
              </Reveal>
              <Reveal delay={120}>
                <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.03] text-white text-balance">
                  A cinematic{' '}
                  <em className="italic font-light text-amber-200/90">edit</em>
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-5 max-w-2xl text-base sm:text-lg text-white/62 leading-relaxed">
                  Hand-picked silhouettes, framed with intent. Tap any piece to order it
                  straight from your store.
                </p>
              </Reveal>
            </div>

            <Reveal delay={260}>
              <div className="hidden shrink-0 items-center gap-3 lg:flex">
                <span className="h-px w-10 bg-white/20" />
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                  Drag / Scroll
                </span>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Horizontal editorial product scroll */}
        <Reveal variant="scale" threshold={0.05}>
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-20 w-12 bg-gradient-to-r from-[#080807] to-transparent sm:w-24 lg:w-32"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-l from-[#080807] to-transparent sm:w-24 lg:w-32"
            />

            <div
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2 [scrollbar-color:rgba(255,255,255,0.24)_transparent] [scrollbar-width:thin] sm:gap-5 sm:px-6 lg:gap-6 lg:px-8 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20"
              aria-label="Scrollable lookbook products"
            >
              {items.map((p, idx) => (
                <Link
                  key={p.id}
                  href={`/${storeSlug}/products/${p.id}`}
                  className="group relative block aspect-[4/5] w-[82vw] flex-none snap-center overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/45 outline-none transition-all duration-500 hover:-translate-y-1 hover:border-white/25 focus-visible:ring-2 focus-visible:ring-amber-200 sm:w-[390px] lg:w-[460px] xl:w-[500px]"
                >
                  <Image
                    src={p.imageUrl as string}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 82vw, (max-width: 1024px) 390px, (max-width: 1280px) 460px, 500px"
                    className="object-cover transition-transform [transition-duration:1400ms] ease-out group-hover:scale-[1.06]"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/18 to-black/5 pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-br from-white/[0.10] via-transparent to-transparent opacity-70 pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                  />

                  <div className="absolute left-4 top-4 flex items-center gap-3 sm:left-5 sm:top-5">
                    <span
                      aria-hidden="true"
                      className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/75"
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {(p.brand?.name || p.category) && (
                      <span className="max-w-[11rem] truncate rounded-full border border-white/15 bg-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white/65 backdrop-blur-md sm:max-w-[14rem]">
                        {p.brand?.name ?? p.category}
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <div className="rounded-2xl border border-white/10 bg-black/28 p-4 backdrop-blur-md sm:p-5">
                      <div className="flex items-end justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-serif text-xl leading-tight text-white line-clamp-2 sm:text-2xl">
                            {p.name}
                          </p>
                          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-100/80">
                            {formatPrice(p.price)}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur transition-all group-hover:border-amber-200/55 group-hover:bg-amber-100 group-hover:text-stone-950">
                          View
                          <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Footnote CTA */}
        <Reveal delay={120}>
          <div className="px-4 pt-8 text-center sm:px-6 sm:pt-10 lg:px-8">
            <Link
              href={`/${storeSlug}/products`}
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/[0.08]"
            >
              Explore the full lookbook
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
