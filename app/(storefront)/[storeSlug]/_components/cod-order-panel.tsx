'use client'

import { FormEvent, useMemo, useState } from 'react'
import Image from 'next/image'
import { ImagePlaceholderIcon, WhatsAppIcon } from './icons'

const DELIVERY_FEE = 20

type SizeOption = {
  size: string
  quantity: number
}

type Props = {
  product: {
    id: string
    name: string
    imageUrl: string | null
    colorName?: string | null
    price: number
    totalStock: number
    sizes: SizeOption[]
  }
  storeSlug: string
  whatsAppUrl: string | null
}

const formatMad = (n: number) =>
  n.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  })

export function CodOrderPanel({ product, storeSlug, whatsAppUrl }: Props) {
  const availableSizes = product.sizes.filter((s) => s.quantity > 0)
  const outOfStockSizes = product.sizes.filter((s) => s.quantity === 0)
  const hasSizes = product.sizes.length > 0
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const selectedSizeStock = useMemo(
    () => availableSizes.find((s) => s.size === selectedSize)?.quantity,
    [availableSizes, selectedSize],
  )
  const maxQuantity = Math.max(1, selectedSizeStock ?? product.totalStock)
  const total = product.price * quantity + DELIVERY_FEE
  const inStock = product.totalStock > 0

  function updateQuantity(next: number) {
    setQuantity(Math.min(Math.max(1, next), maxQuantity))
  }

  function chooseSize(size: SizeOption) {
    setSelectedSize(size.size)
    setError('')
    setQuantity((current) => Math.min(current, Math.max(1, size.quantity)))
  }

  function openModal() {
    if (!inStock || !whatsAppUrl) return
    if (hasSizes && !selectedSize) {
      setError('Veuillez choisir une taille avant de commander.')
      return
    }
    setError('')
    setOpen(true)
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!whatsAppUrl) return
    if (hasSizes && !selectedSize) {
      setError('Veuillez choisir une taille avant de commander.')
      setOpen(false)
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const phone = String(formData.get('phone') ?? '').trim()
    const address = String(formData.get('address') ?? '').trim()
    const city = String(formData.get('city') ?? '').trim()
    const productUrl = `${window.location.origin}/${storeSlug}/products/${product.id}`
    const orderUrl = new URL(whatsAppUrl)

    const message = [
      'Commande avec paiement à la livraison',
      '',
      `Produit: ${product.name}`,
      `Lien produit: ${productUrl}`,
      ...(product.colorName ? [`Couleur: ${product.colorName}`] : []),
      `Taille: ${selectedSize || 'Standard'}`,
      `Quantité: ${quantity}`,
      `Prix unitaire: ${formatMad(product.price)}`,
      `Frais de livraison: ${formatMad(DELIVERY_FEE)}`,
      `Total: ${formatMad(total)}`,
      '',
      `Nom الاسم: ${name}`,
      `Téléphone الهاتف: ${phone}`,
      `Adresse العنوان: ${address}`,
      `Ville المدينة: ${city}`,
    ].join('\n')

    orderUrl.searchParams.set('text', message)
    window.open(orderUrl.toString(), '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <>
      {hasSizes && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/70">
              Available sizes
            </p>
            <p className="text-xs text-white/40">
              {availableSizes.length} of {product.sizes.length} in stock
            </p>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {availableSizes.map((s) => {
              const active = selectedSize === s.size
              return (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => chooseSize(s)}
                  className={`aspect-square rounded-xl border grid place-items-center text-sm font-semibold transition-all select-none ${
                    active
                      ? 'border-emerald-300 bg-emerald-300 text-stone-950 shadow-lg shadow-emerald-500/20'
                      : 'border-amber-100/30 bg-amber-100 text-stone-950 hover:bg-white hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                  title={`${s.quantity} in stock`}
                  aria-pressed={active}
                >
                  {s.size}
                </button>
              )
            })}
            {outOfStockSizes.map((s) => (
              <div
                key={s.size}
                className="aspect-square rounded-xl border border-white/10 bg-white/[0.035] grid place-items-center text-sm font-medium text-white/25 line-through cursor-not-allowed select-none"
                title="Out of stock"
              >
                {s.size}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/70">
              Quantité
            </p>
            <p className="mt-1 text-xs text-white/40">
              {hasSizes && selectedSizeStock
                ? `${selectedSizeStock} disponible(s) pour ${selectedSize}`
                : `${product.totalStock} disponible(s)`}
            </p>
          </div>
          <div className="flex items-center rounded-full border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => updateQuantity(quantity - 1)}
              disabled={quantity <= 1}
              className="grid h-9 w-9 place-items-center rounded-full text-lg text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Diminuer la quantité"
            >
              -
            </button>
            <span className="min-w-10 text-center font-mono text-sm text-white">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(quantity + 1)}
              disabled={quantity >= maxQuantity}
              className="grid h-9 w-9 place-items-center rounded-full text-lg text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Augmenter la quantité"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="-mt-4 mb-5 rounded-2xl border border-amber-200/20 bg-amber-200/[0.08] px-4 py-3 text-sm text-amber-100">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={openModal}
        disabled={!inStock || !whatsAppUrl}
        className="mb-3 inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-amber-100/30 bg-amber-100 px-6 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-950 shadow-lg shadow-amber-500/10 transition-all hover:bg-white hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/35 disabled:hover:translate-y-0"
      >
        <WhatsAppIcon className="h-5 w-5 text-[#128C3A]" />
        Commander maintenant - Paiement à la livraison
      </button>
      {!whatsAppUrl && (
        <p className="mb-8 text-center text-xs text-white/40">
          La commande WhatsApp est indisponible pour cette boutique.
        </p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-3 backdrop-blur-md sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cod-modal-title"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0a09] text-white shadow-2xl shadow-black/70">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              ×
            </button>

            <div className="shrink-0 border-b border-white/10 px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
              <p className="mb-3 pr-12 font-mono text-[10px] uppercase tracking-[0.28em] text-amber-200/65">
                Paiement à la livraison
              </p>
              <h2 id="cod-modal-title" className="pr-10 font-serif text-2xl leading-tight text-white sm:text-3xl">
                Commande avec paiement à la livraison
              </h2>
            </div>

            <form onSubmit={submitOrder} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10 sm:h-24 sm:w-24">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <ImagePlaceholderIcon className="h-8 w-8 text-white/35" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-lg leading-tight text-white line-clamp-2 sm:text-xl">
                        {product.name}
                      </p>
                      <div className="mt-3 grid gap-1 text-sm text-white/55">
                        {product.colorName && <p>Couleur: <span className="text-white">{product.colorName}</span></p>}
                        <p>Taille: <span className="text-white">{selectedSize || 'Standard'}</span></p>
                        <p>Quantité: <span className="text-white">{quantity}</span></p>
                        <p>Prix: <span className="text-white">{formatMad(product.price)}</span></p>
                        <p>Livraison: <span className="text-white">{formatMad(DELIVERY_FEE)}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
                      Total
                    </span>
                    <span className="font-mono text-lg text-amber-100">{formatMad(total)}</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="name" label="Nom الاسم" autoComplete="name" />
                  <Field name="phone" label="Téléphone الهاتف" autoComplete="tel" />
                </div>
                <Field name="address" label="Adresse العنوان" autoComplete="street-address" />
                <Field name="city" label="Ville المدينة" autoComplete="address-level2" />
              </div>

              <div className="shrink-0 border-t border-white/10 bg-[#0b0a09] px-5 py-4 sm:px-7">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-6 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-[#1ebe57] hover:-translate-y-0.5"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Envoyer la commande sur WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({
  name,
  label,
  autoComplete,
}: {
  name: string
  label: string
  autoComplete: string
}) {
  return (
    <label className="grid gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
        {label}
      </span>
      <input
        required
        name={name}
        autoComplete={autoComplete}
        className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-200/45 focus:ring-2 focus:ring-amber-200/10"
      />
    </label>
  )
}
