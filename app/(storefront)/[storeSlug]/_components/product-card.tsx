import Link from 'next/link'
import Image from 'next/image'
import { ImagePlaceholderIcon } from './icons'

export type StorefrontProduct = {
  id: string
  name: string
  category: string | null
  imageUrl: string | null
  price: number
  totalStock: number
  brand: { id: string; name: string; slug: string } | null
  sizes: { size: string; quantity: number }[]
}

type Props = {
  product: StorefrontProduct
  href: string
  tone?: 'light' | 'dark'
  presentation?: 'default' | 'benami'
}

export function ProductCard({ product, href, tone = 'light', presentation = 'default' }: Props) {
  const inStock = product.totalStock > 0
  const isLowStock = inStock && product.totalStock <= 5
  const isDark = tone === 'dark'
  const isBenami = presentation === 'benami'
  const formattedPrice = product.price.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  })

  return (
    <Link href={href} className="group block focus:outline-none">
      <div
        className={`relative overflow-hidden transition-all duration-500 ease-out will-change-transform group-hover:-translate-y-1 group-hover:shadow-2xl group-focus-visible:ring-2 ${isBenami ? 'aspect-[3.8/5] rounded-[20px] sm:rounded-[24px]' : 'aspect-[4/5] rounded-[22px] sm:rounded-[26px]'} ${
          isDark
            ? 'bg-white/[0.045] ring-1 ring-white/10 group-hover:ring-white/25 group-hover:shadow-black/50 group-focus-visible:ring-amber-200'
            : 'bg-stone-100 ring-1 ring-slate-200/70 group-hover:ring-slate-300 group-hover:shadow-slate-900/12 group-focus-visible:ring-slate-900'
        }`}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <ImagePlaceholderIcon className="h-12 w-12 text-slate-300" />
          </div>
        )}

        {/* Subtle gradient wash on hover */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90"
        />

        <div className="absolute left-2.5 top-2.5 right-2.5 flex items-start justify-between gap-2 sm:left-3 sm:right-3 sm:top-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] shadow-lg backdrop-blur-sm sm:text-[9px] sm:tracking-[0.18em] ${
              inStock
                ? 'border-emerald-300/35 bg-emerald-400/95 text-emerald-950'
                : 'border-white/20 bg-white/90 text-slate-900'
            }`}
          >
            {inStock ? 'En stock' : 'Rupture'}
          </span>
          {isLowStock && (
            <span className="rounded-full border border-amber-200/50 bg-amber-300 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-black/20 sm:text-[9px] sm:tracking-[0.18em]">
              {product.totalStock} left
            </span>
          )}
        </div>

        {/* Sold-out overlay */}
        {!inStock && (
          <div className={`absolute inset-0 grid place-items-center backdrop-blur-[2px] ${isDark ? 'bg-black/55' : 'bg-white/60'}`}>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
              Indisponible
            </span>
          </div>
        )}

        {/* Hover CTA pill */}
        {inStock && (
          <div className="absolute inset-x-3 bottom-3 hidden translate-y-3 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 sm:block">
            <div className={`rounded-full px-4 py-2 text-center shadow-lg backdrop-blur ${isDark ? 'border border-white/15 bg-black/55' : 'bg-white/95'}`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Voir le produit →</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={`${isBenami ? 'mt-3 min-h-[7rem] space-y-2 sm:mt-4' : 'mt-3 space-y-1.5 sm:mt-4'}`}>
        {(product.brand || product.category) && (
          <p className={`truncate text-[9px] font-semibold uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.2em] ${isDark ? 'text-amber-100/55' : 'text-slate-400'}`}>
            {product.brand?.name ?? product.category}
          </p>
        )}
        <h3 className={`line-clamp-2 text-[13px] font-medium leading-snug transition-colors sm:text-[15px] ${isDark ? 'text-white/92 group-hover:text-white' : 'text-slate-900 group-hover:text-slate-600'}`}>
          {product.name}
        </h3>
        <div className="flex items-end justify-between gap-2 pt-1">
          <p className={`text-[15px] font-extrabold tracking-tight sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formattedPrice}
          </p>
          {product.sizes.length > 0 && (
            <p className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] sm:text-[10px] ${isDark ? 'border-white/10 text-white/45' : 'border-slate-200 text-slate-400'}`}>
              {product.sizes.length} size{product.sizes.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
