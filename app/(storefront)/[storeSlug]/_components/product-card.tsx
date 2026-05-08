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
}

export function ProductCard({ product, href }: Props) {
  const inStock = product.totalStock > 0
  const isLowStock = inStock && product.totalStock <= 5
  const formattedPrice = product.price.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  })

  return (
    <Link href={href} className="group block focus:outline-none">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 ring-1 ring-slate-200/60 group-hover:ring-slate-300 group-hover:shadow-xl group-hover:shadow-slate-900/10 group-hover:-translate-y-1 transition-all duration-500 ease-out will-change-transform group-focus-visible:ring-2 group-focus-visible:ring-slate-900">
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
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] grid place-items-center">
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
            <div className="rounded-full bg-white/95 backdrop-blur shadow-lg px-4 py-2 text-center">
              <span className="text-xs font-semibold text-slate-900">View details →</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 space-y-1.5">
        {(product.brand || product.category) && (
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            {product.brand?.name ?? product.category}
          </p>
        )}
        <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug group-hover:text-slate-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-baseline justify-between pt-1 gap-2">
          <p className="text-base font-bold text-slate-900 tracking-tight">
            {formattedPrice}
          </p>
          {product.sizes.length > 0 && (
            <p className="text-[11px] text-slate-400 shrink-0">
              {product.sizes.length} size{product.sizes.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
