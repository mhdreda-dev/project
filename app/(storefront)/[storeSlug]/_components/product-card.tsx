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
        className={`relative aspect-square rounded-2xl overflow-hidden group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-500 ease-out will-change-transform group-focus-visible:ring-2 ${
          isDark
            ? 'bg-white/[0.04] ring-1 ring-white/10 group-hover:ring-white/25 group-hover:shadow-black/40 group-focus-visible:ring-amber-200'
            : 'bg-stone-100 ring-1 ring-slate-200/60 group-hover:ring-slate-300 group-hover:shadow-slate-900/10 group-focus-visible:ring-slate-900'
        }`}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <ImagePlaceholderIcon className="h-12 w-12 text-slate-300" />
          </div>
        )}

        {/* Subtle gradient wash on hover */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />

        {/* Sold-out overlay */}
        {!inStock && (
          <div className={`absolute inset-0 backdrop-blur-[2px] grid place-items-center ${isDark ? 'bg-black/55' : 'bg-white/60'}`}>
            <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
              Sold out
            </span>
          </div>
        )}

        {/* Low-stock badge */}
        {isLowStock && (
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm motion-safe:animate-sf-glow-pulse">
              Only {product.totalStock} left
            </span>
          </div>
        )}

        {/* Hover CTA pill */}
        {inStock && (
          <div className="hidden sm:block absolute inset-x-3 bottom-3 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
            <div className={`rounded-full backdrop-blur shadow-lg px-4 py-2 text-center ${isDark ? 'border border-white/15 bg-black/45' : 'bg-white/95'}`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>View details →</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 space-y-1.5">
        {(product.brand || product.category) && (
          <p className={`text-[10px] uppercase tracking-widest font-semibold ${isDark ? 'text-amber-100/45' : 'text-slate-400'}`}>
            {product.brand?.name ?? product.category}
          </p>
        )}
        <h3 className={`text-sm font-medium line-clamp-2 leading-snug transition-colors ${isDark ? 'text-white/88 group-hover:text-white' : 'text-slate-900 group-hover:text-slate-600'}`}>
          {product.name}
        </h3>
        <div className="flex items-baseline justify-between pt-1 gap-2">
          <p className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formattedPrice}
          </p>
          {product.sizes.length > 0 && (
            <p className={`text-[11px] shrink-0 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>
              {product.sizes.length} size{product.sizes.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
