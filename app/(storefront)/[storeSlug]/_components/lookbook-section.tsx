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
 * vertical glassmorphism stack. Each card links to the product detail page.
 * Renders nothing if there are no products with images.
 */
export function LookbookSection({ products, storeSlug }: Props) {
  const items = products.filter((p) => p.imageUrl).slice(0, 6)
  if (items.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-20 sm:py-28 lg:py-36">
      {/* Layered backdrop: gradient glows + dot grid mask */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[42rem] w-[42rem] rounded-full bg-amber-500/[0.08] blur-3xl" />
        <div className="absolute bottom-0 -right-24 h-[32rem] w-[32rem] rounded-full bg-emerald-500/[0.07] blur-3xl" />
        <div className="absolute top-1/2 -left-32 h-[28rem] w-[28rem] rounded-full bg-rose-500/[0.06] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.6) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-14 sm:mb-20 max-w-2xl mx-auto">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-amber-200/70 font-semibold mb-5">
              The lookbook
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5 text-white">
              A cinematic{' '}
              <span className="italic font-light text-amber-200/90">edit</span>
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="text-base sm:text-lg text-slate-300/80 leading-relaxed">
              Hand-picked silhouettes, framed with intent. Tap any piece to order it
              straight from your store.
            </p>
          </Reveal>
        </div>

        {/* Glassmorphism container with the product stack */}
        <Reveal variant="scale" threshold={0.05}>
          <div className="relative mx-auto max-w-md sm:max-w-lg lg:max-w-xl">
            {/* Outer halo */}
            <div
              aria-hidden="true"
              className="absolute -inset-6 sm:-inset-10 rounded-[40px] bg-gradient-to-br from-amber-500/10 via-transparent to-emerald-500/10 blur-2xl pointer-events-none"
            />

            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 sm:p-7 lg:p-9 shadow-2xl shadow-black/50">
              {/* Inner sheen */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/[0.06] via-transparent to-transparent pointer-events-none"
              />
              {/* Top edge highlight */}
              <div
                aria-hidden="true"
                className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
              />

              <div className="relative flex flex-col gap-5 sm:gap-7">
                {items.map((p, idx) => (
                  <Reveal
                    key={p.id}
                    delay={idx * 90}
                    variant="up"
                    threshold={0.1}
                  >
                    <Link
                      href={`/${storeSlug}/products/${p.id}`}
                      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    >
                      <Image
                        src={p.imageUrl as string}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 480px, 560px"
                        className="object-cover transition-transform [transition-duration:1200ms] ease-out group-hover:scale-[1.04]"
                      />

                      {/* Bottom shade for legibility */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none"
                      />

                      {/* Numbered tag */}
                      <span
                        aria-hidden="true"
                        className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold"
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Caption / footer */}
                      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          {(p.brand?.name || p.category) && (
                            <p className="text-[10px] uppercase tracking-[0.25em] text-white/65 font-semibold mb-1 truncate">
                              {p.brand?.name ?? p.category}
                            </p>
                          )}
                          <p className="text-base sm:text-lg font-semibold tracking-tight text-white line-clamp-1">
                            {p.name}
                          </p>
                          <p className="text-sm text-white/85 mt-0.5 font-medium">
                            {formatPrice(p.price)}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 px-3 py-1.5 text-[11px] font-semibold text-white opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                          View
                          <ArrowRightIcon className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Footnote CTA */}
        <Reveal delay={120}>
          <div className="text-center mt-14 sm:mt-20">
            <Link
              href={`/${storeSlug}/products`}
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all"
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
