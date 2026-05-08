// wa.me requires the phone number as digits only — strip +, spaces, dashes, parens.
function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

function formatMad(price: number): string {
  return price.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  })
}

export function buildStoreWhatsAppUrl(store: { name: string; phone: string | null }): string | null {
  const digits = normalizePhoneForWhatsApp(store.phone ?? '')
  if (!digits) return null
  const message = `Hello ${store.name}, I'd like to know more about your products.`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function buildProductWhatsAppUrl(
  store: { name: string; phone: string | null },
  product: { name: string; sku: string; price: number },
): string | null {
  const digits = normalizePhoneForWhatsApp(store.phone ?? '')
  if (!digits) return null
  const message = [
    `Hello ${store.name}, I'd like to order:`,
    '',
    `• ${product.name}`,
    `• SKU: ${product.sku}`,
    `• Price: ${formatMad(product.price)}`,
    '',
    'Is this still available?',
  ].join('\n')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
