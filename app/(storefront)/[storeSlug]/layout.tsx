import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicStore } from '@/lib/storefront/storefront.service'
import { buildStoreWhatsAppUrl } from '@/lib/storefront/whatsapp'

type Props = {
  children: React.ReactNode
  params: { storeSlug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getPublicStore(params.storeSlug)
  if (!store) return { title: 'Store not found' }
  return {
    title: { default: store.name, template: `%s · ${store.name}` },
    description: `Shop the latest collection at ${store.name}. Order easily on WhatsApp.`,
  }
}

export default async function StorefrontLayout({ children, params }: Props) {
  const store = await getPublicStore(params.storeSlug)
  if (!store) notFound()

  const whatsAppUrl = buildStoreWhatsAppUrl(store)
  const initial = store.name.trim().charAt(0).toUpperCase() || 'S'

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      {/* Announcement bar */}
      <div className="bg-slate-900 text-stone-100 text-[11px] sm:text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center gap-2 sm:gap-3 text-center">
          <span className="hidden sm:inline">⚡ Fast WhatsApp response</span>
          <span className="hidden sm:inline text-stone-500">·</span>
          <span>Live stock · Order in one message</span>
        </div>
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-stone-50/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href={`/${store.slug}`} className="group flex items-center gap-2.5 min-w-0">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-stone-100 text-sm font-semibold tracking-wide group-hover:bg-slate-800 transition">
              {initial}
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900 truncate">
              {store.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            <Link href={`/${store.slug}`} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
              Home
            </Link>
            <Link href={`/${store.slug}/products`} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
              Products
            </Link>
          </nav>

          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm transition shrink-0"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Order on WhatsApp</span>
              <span className="sm:hidden">Order</span>
            </a>
          ) : (
            <Link
              href={`/${store.slug}/products`}
              className="text-sm font-semibold text-slate-900 hover:text-slate-700 shrink-0"
            >
              Shop →
            </Link>
          )}
        </div>

        {/* Mobile sub-nav */}
        <div className="md:hidden border-t border-slate-200/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 h-11 flex items-center gap-6" aria-label="Primary mobile">
            <Link href={`/${store.slug}`} className="text-sm font-medium text-slate-600 hover:text-slate-900">Home</Link>
            <Link href={`/${store.slug}/products`} className="text-sm font-medium text-slate-600 hover:text-slate-900">Products</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white mt-16 sm:mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-stone-100 text-sm font-semibold tracking-wide">
                {initial}
              </div>
              <p className="text-base font-semibold tracking-tight text-slate-900">{store.name}</p>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Modern shopping experience powered by direct WhatsApp orders. No checkout, no friction.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">Shop</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={`/${store.slug}`} className="text-slate-600 hover:text-slate-900 transition">Home</Link></li>
              <li><Link href={`/${store.slug}/products`} className="text-slate-600 hover:text-slate-900 transition">All products</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">Contact</p>
            <ul className="space-y-2.5 text-sm">
              {store.phone && (
                <li>
                  <a href={`tel:${store.phone}`} className="text-slate-600 hover:text-slate-900 transition">
                    {store.phone}
                  </a>
                </li>
              )}
              {whatsAppUrl && (
                <li>
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
                    WhatsApp
                  </a>
                </li>
              )}
              {store.address && <li className="text-slate-600">{store.address}</li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
  )
}
