import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicStore } from '@/lib/storefront/storefront.service'
import { buildStoreWhatsAppUrl } from '@/lib/storefront/whatsapp'
import { getStoreLogoUrl } from '@/lib/storefront/logos'
import { StorefrontLogo } from './_components/storefront-logo'
import { ScrollHeader } from './_components/scroll-header'
import { WhatsAppFab } from './_components/whatsapp-fab'
import { WhatsAppIcon } from './_components/icons'

type Props = {
  children: React.ReactNode
  params: { storeSlug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getPublicStore(params.storeSlug)
  if (!store) return { title: 'Store not found' }
  const logoUrl = getStoreLogoUrl(store.slug)
  return {
    title: { default: store.name, template: `%s · ${store.name}` },
    description: `Shop the latest collection at ${store.name}. Order easily on WhatsApp.`,
    icons: logoUrl ? { icon: logoUrl, apple: logoUrl } : undefined,
    openGraph: {
      title: store.name,
      description: `Shop ${store.name}. Order on WhatsApp.`,
      type: 'website',
      ...(logoUrl ? { images: [{ url: logoUrl }] } : {}),
    },
  }
}

export default async function StorefrontLayout({ children, params }: Props) {
  const store = await getPublicStore(params.storeSlug)
  if (!store) notFound()

  const whatsAppUrl = buildStoreWhatsAppUrl(store)
  const logoUrl = getStoreLogoUrl(store.slug)

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

      {/* Sticky scroll-aware header */}
      <ScrollHeader>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href={`/${store.slug}`} className="group flex items-center gap-2.5 min-w-0">
            <StorefrontLogo
              storeName={store.name}
              src={logoUrl}
              size="md"
              priority
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-base font-semibold tracking-tight text-slate-900 truncate">
              {store.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            <Link
              href={`/${store.slug}`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href={`/${store.slug}/products`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
            >
              Products
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>

          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all shrink-0"
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
      </ScrollHeader>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white mt-16 sm:mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <StorefrontLogo storeName={store.name} src={logoUrl} size="md" />
              <p className="text-base font-semibold tracking-tight text-slate-900">{store.name}</p>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Modern shopping experience powered by direct WhatsApp orders. No checkout, no friction.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">Shop</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={`/${store.slug}`} className="text-slate-600 hover:text-slate-900 transition-colors">Home</Link></li>
              <li><Link href={`/${store.slug}/products`} className="text-slate-600 hover:text-slate-900 transition-colors">All products</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">Contact</p>
            <ul className="space-y-2.5 text-sm">
              {store.phone && (
                <li>
                  <a href={`tel:${store.phone}`} className="text-slate-600 hover:text-slate-900 transition-colors">
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
                    className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors"
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

      {/* Floating WhatsApp FAB (desktop only — mobile already has header CTA / page CTAs) */}
      {whatsAppUrl && <WhatsAppFab url={whatsAppUrl} />}
    </div>
  )
}
