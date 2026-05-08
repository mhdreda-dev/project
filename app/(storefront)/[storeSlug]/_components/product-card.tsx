import Link from 'next/link'
import Image from 'next/image'

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

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
          inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          {inStock ? 'In stock' : 'Out of stock'}
        </div>
      </div>

      <div className="space-y-1">
        {(product.brand || product.category) && (
          <p className="text-xs text-slate-400 uppercase tracking-wide">
            {product.brand?.name ?? product.category}
          </p>
        )}
        <p className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-slate-600 transition-colors">
          {product.name}
        </p>
        <p className="text-sm font-semibold text-slate-900">
          {product.price.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 })}
        </p>
        {product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {product.sizes.slice(0, 5).map((s) => (
              <span
                key={s.size}
                className={`px-1.5 py-0.5 text-xs rounded border ${
                  s.quantity > 0
                    ? 'border-slate-300 text-slate-600'
                    : 'border-slate-200 text-slate-300 line-through'
                }`}
              >
                {s.size}
              </span>
            ))}
            {product.sizes.length > 5 && (
              <span className="px-1.5 py-0.5 text-xs text-slate-400">+{product.sizes.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
