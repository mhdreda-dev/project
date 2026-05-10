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
}

export function ProductCard({ product, href, tone = 'light' }: Props) {
  const inStock = product.totalStock > 0
  const isLowStock = inStock && product.totalStock <= 5
  const isDark = tone === 'dark'
  const formattedPrice = product.price.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  })

  return (
    <Link href={href} className="group block focus:outline-none">
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-[22px] transition-all duration-500 ease-out will-change-transform group-hover:-translate-y-1 group-hover:shadow-2xl group-focus-visible:ring-2 sm:rounded-[26px] ${
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

        <div className="absolute left-3 top-3 right-3 flex items-start justify-between gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] shadow-lg backdrop-blur-sm ${
              inStock
                ? 'border-emerald-300/35 bg-emerald-400/95 text-emerald-950'
                : 'border-white/20 bg-white/90 text-slate-900'
            }`}
          >
            {inStock ? 'In stock' : 'Sold out'}
          </span>
          {isLowStock && (
            <span className="rounded-full border border-amber-200/50 bg-amber-300 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-black/20">
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
      <div className="mt-3 space-y-1.5 sm:mt-4">
        {(product.brand || product.category) && (
          <p className={`truncate text-[10px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-amber-100/48' : 'text-slate-400'}`}>
            {product.brand?.name ?? product.category}
          </p>
        )}
        <h3 className={`line-clamp-2 text-sm font-medium leading-snug transition-colors sm:text-[15px] ${isDark ? 'text-white/90 group-hover:text-white' : 'text-slate-900 group-hover:text-slate-600'}`}>
          {product.name}
        </h3>
        <div className="flex items-end justify-between gap-2 pt-1">
          <p className={`text-[15px] font-bold tracking-tight sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formattedPrice}
          </p>
          {product.sizes.length > 0 && (
            <p className={`shrink-0 text-[10px] sm:text-[11px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              {product.sizes.length} size{product.sizes.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
