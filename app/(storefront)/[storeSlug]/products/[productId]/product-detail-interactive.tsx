'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CodOrderPanel } from '../../_components/cod-order-panel'
import { Reveal } from '../../_components/reveal'
import {
  ArrowLeftIcon,
  BoltIcon,
  CheckBadgeIcon,
  ImagePlaceholderIcon,
  WhatsAppIcon,
} from '../../_components/icons'

type SizeOption = { size: string; quantity: number }
type ProductVariant = {
  id: string
  colorName: string
  colorHex: string | null
  imageUrl: string | null
  images: { url: string }[]
  sizes: SizeOption[]
}
type Product = {
  id: string
  name: string
  description: string | null
  sku: string
  category: string | null
  imageUrl: string | null
  price: number
  totalStock: number
  sizes: SizeOption[]
  variants?: ProductVariant[]
  brand: { id: string; name: string; slug: string } | null
}
type Store = { name: string; slug: string }

export function ProductDetailInteractive({
  store,
  product,
  whatsAppUrl,
  formattedPrice,
}: {
  store: Store
  product: Product
  whatsAppUrl: string | null
  formattedPrice: string
}) {
  const variants = product.variants ?? []
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? '')
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null
  const activeImages = useMemo(() => {
    if (!selectedVariant) return product.imageUrl ? [product.imageUrl] : []
    return [
      ...(selectedVariant.imageUrl ? [selectedVariant.imageUrl] : []),
      ...selectedVariant.images.map((image) => image.url),
    ].filter(Boolean)
  }, [product.imageUrl, selectedVariant])
  const activeImage = activeImages[0] ?? product.imageUrl
  const activeSizes = selectedVariant ? selectedVariant.sizes : product.sizes
  const activeStock = activeSizes.reduce((sum, size) => sum + size.quantity, 0)
  const inStock = activeStock > 0
  const selectedWhatsAppUrl = useMemo(() => {
    if (!whatsAppUrl) return null
    const orderUrl = new URL(whatsAppUrl)
    const message = [
      `Hello ${store.name}, I'd like to order:`,
      '',
      `• ${product.name}`,
      ...(selectedVariant ? [`• Color: ${selectedVariant.colorName}`] : []),
      `• SKU: ${product.sku}`,
      `• Price: ${formattedPrice}`,
      '',
      'Is this still available?',
    ].join('\n')
    orderUrl.searchParams.set('text', message)
    return orderUrl.toString()
  }, [formattedPrice, product.name, product.sku, selectedVariant, store.name, whatsAppUrl])

  return (
    <div className="relative overflow-hidden pb-24 lg:pb-0">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/3 h-[32rem] w-[32rem] rounded-full bg-amber-300/[0.08] blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-emerald-300/[0.05] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/55 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <nav className="motion-safe:animate-sf-fade-in flex items-center gap-2 overflow-hidden font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 mb-6 sm:mb-8" aria-label="Breadcrumb">
          <Link href={`/${store.slug}`} className="hover:text-white/75 transition-colors shrink-0">{store.name}</Link>
          <span className="text-white/20">/</span>
          <Link href={`/${store.slug}/products`} className="hover:text-white/75 transition-colors shrink-0">Products</Link>
          <span className="text-white/20">/</span>
          <span className="text-amber-100/75 truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start motion-safe:animate-sf-scale-in">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white/[0.04] ring-1 ring-white/10 shadow-2xl shadow-black/35 group">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={selectedVariant ? `${product.name} ${selectedVariant.colorName}` : product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <ImagePlaceholderIcon className="h-20 w-20 text-slate-300" />
                </div>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm grid place-items-center">
                  <span className="rounded-full bg-slate-900 text-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest motion-safe:animate-sf-bounce-in">
                    Out of stock
                  </span>
                </div>
              )}
              <div aria-hidden="true" className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/25 blur-3xl pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-md sm:p-8 lg:p-10">
            <div className="motion-safe:animate-sf-fade-up flex items-center gap-2 flex-wrap mb-3" style={{ animationDelay: '80ms' }}>
              {product.brand && (
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-100/65 font-semibold">
                  {product.brand.name}
                </span>
              )}
              {product.brand && product.category && <span className="text-white/20">·</span>}
              {product.category && (
                <Link href={`/${store.slug}/products?category=${encodeURIComponent(product.category)}`} className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40 hover:text-white/75 transition-colors">
                  {product.category}
                </Link>
              )}
            </div>

            <h1 className="motion-safe:animate-sf-fade-up font-serif text-3xl sm:text-5xl leading-tight text-white mb-4 text-balance" style={{ animationDelay: '160ms' }}>
              {product.name}
            </h1>
            <p className="motion-safe:animate-sf-fade-up font-mono text-xl uppercase tracking-[0.16em] text-amber-100/90 mb-5" style={{ animationDelay: '240ms' }}>
              {formattedPrice}
            </p>

            {variants.length > 0 && (
              <div className="motion-safe:animate-sf-fade-up mb-6" style={{ animationDelay: '280ms' }}>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/70">Color</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => {
                    const active = variant.id === selectedVariantId
                    const stock = variant.sizes.reduce((sum, size) => sum + size.quantity, 0)
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all ${
                          active
                            ? 'border-amber-200 bg-amber-100 text-stone-950 shadow-lg shadow-amber-500/15'
                            : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: variant.colorHex ?? '#111827' }} />
                        {variant.colorName}
                        <span className={active ? 'text-stone-600' : 'text-white/35'}>({stock})</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="motion-safe:animate-sf-fade-up flex items-center gap-2 mb-8" style={{ animationDelay: '320ms' }}>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                inStock
                  ? 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/25'
                  : 'bg-red-400/10 text-red-200 ring-1 ring-red-300/25'
              }`}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping ${inStock ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </span>
                {inStock ? `${activeStock} in stock` : 'Currently unavailable'}
              </span>
            </div>

            <Reveal delay={50}>
              <CodOrderPanel
                key={selectedVariant?.id ?? 'simple'}
                product={{
                  id: product.id,
                  name: product.name,
                  imageUrl: activeImage,
                  colorName: selectedVariant?.colorName ?? null,
                  price: product.price,
                  totalStock: activeStock,
                  sizes: activeSizes,
                }}
                storeSlug={store.slug}
                whatsAppUrl={whatsAppUrl}
              />
            </Reveal>

            {whatsAppUrl && (
              <Reveal delay={120} className="hidden lg:block">
                <a
                  href={selectedWhatsAppUrl ?? whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group inline-flex items-center justify-center gap-2.5 w-full rounded-full px-6 py-4 text-sm font-semibold mb-3 transition-all ${
                    inStock
                      ? 'bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5'
                      : 'bg-white/10 text-white/35 cursor-not-allowed pointer-events-none'
                  }`}
                  aria-disabled={!inStock}
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  {inStock ? `Order ${formattedPrice} on WhatsApp` : 'Currently unavailable'}
                </a>
                <p className="text-xs text-white/45 text-center mb-8">No checkout, no signup. We reply within minutes.</p>
              </Reveal>
            )}

            <Reveal delay={180}>
              <div className="grid grid-cols-3 gap-3 mb-8 pt-6 border-t border-white/10">
                <Trust icon={<BoltIcon className="h-4 w-4" />} label="Fast reply" />
                <Trust icon={<CheckBadgeIcon className="h-4 w-4" />} label="Live stock" />
                <Trust icon={<WhatsAppIcon className="h-4 w-4" />} label="1-tap order" />
              </div>
            </Reveal>

            {product.description && (
              <Reveal delay={240}>
                <div className="border-t border-white/10 pt-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/70 mb-3">Description</p>
                  <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>
              </Reveal>
            )}

            <p className="text-xs text-white/35 mt-6 pt-6 border-t border-white/10">SKU · {product.sku}</p>
          </div>
        </div>

        <Reveal>
          <div className="mt-12 sm:mt-16">
            <Link href={`/${store.slug}/products`} className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/45 hover:text-white transition-colors">
              <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to all products
            </Link>
          </div>
        </Reveal>
      </div>

      {whatsAppUrl && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#080807]/90 backdrop-blur-xl p-3 shadow-[0_-4px_24px_-12px_rgb(0_0_0_/_0.6)] motion-safe:animate-sf-fade-up">
          <a
            href={selectedWhatsAppUrl ?? whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 w-full rounded-full px-5 py-3.5 text-sm font-semibold transition-all ${
              inStock
                ? 'bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-lg shadow-emerald-500/30 active:scale-95'
                : 'bg-white/10 text-white/35 cursor-not-allowed pointer-events-none'
            }`}
            aria-disabled={!inStock}
          >
            <WhatsAppIcon className="h-5 w-5" />
            {inStock ? `Order ${formattedPrice} on WhatsApp` : 'Currently unavailable'}
          </a>
        </div>
      )}
    </div>
  )
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-3 text-center hover:ring-white/25 hover:-translate-y-0.5 transition-all">
      <div className="text-amber-100/75">{icon}</div>
      <p className="text-[11px] font-medium text-white/55 leading-tight">{label}</p>
    </div>
  )
}
