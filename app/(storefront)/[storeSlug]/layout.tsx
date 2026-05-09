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
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-[#080807] text-white antialiased selection:bg-amber-200 selection:text-stone-950">
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(251,191,36,0.12),transparent_32%),radial-gradient(circle_at_8%_30%,rgba(244,114,182,0.05),transparent_28%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.05),transparent_26%),linear-gradient(180deg,#080807_0%,#11100e_42%,#080807_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.055] [mask-image:linear-gradient(180deg,black,transparent_85%)]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.75) 1px, transparent 0)',
            backgroundSize: '30px 30px',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.42)_100%)]" />
      </div>

      {/* Announcement bar — editorial mono ribbon */}
      <div className="relative bg-[#0a0a0a]/95 text-white/60 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center gap-3 sm:gap-5 text-center font-mono text-[10px] sm:text-[11px] tracking-[0.28em] uppercase">
          <span className="hidden sm:inline">⚡ Fast WhatsApp response</span>
          <span className="hidden sm:inline text-white/25">·</span>
          <span>Live stock · Order in one message</span>
        </div>
      </div>

      {/* Sticky scroll-aware header — editorial dark glass */}
      <ScrollHeader>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-[64px] sm:h-[72px] flex items-center justify-between gap-4 text-white">
          {/* Left cluster: brand wordmark + center nav */}
          <div className="flex items-center gap-8 lg:gap-12 min-w-0">
            <Link
              href={`/${store.slug}`}
              className="group flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0"
            >
              <StorefrontLogo
                storeName={store.name}
                src={logoUrl}
                size="sm"
                priority
                className="transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-serif text-[20px] sm:text-[24px] tracking-[-0.02em] leading-none text-white truncate">
                {store.name}
                <span className="text-amber-200/90">.</span>
              </span>
            </Link>

            <nav
              className="hidden md:flex items-center gap-8 font-mono text-[11px] tracking-[0.22em] uppercase text-white/65"
              aria-label="Primary"
            >
              <Link href={`/${store.slug}`} className="relative group hover:text-white transition-colors">
                Home
                <span
                  aria-hidden="true"
                  className="absolute -bottom-2 left-0 right-0 h-px bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                />
              </Link>
              <Link
                href={`/${store.slug}/products`}
                className="relative group hover:text-white transition-colors"
              >
                Shop
                <span
                  aria-hidden="true"
                  className="absolute -bottom-2 left-0 right-0 h-px bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                />
              </Link>
            </nav>
          </div>

          {/* Right cluster: WhatsApp pill */}
          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 hover:border-white/35 bg-white/[0.06] hover:bg-white/[0.14] backdrop-blur px-3.5 sm:px-4 py-2 sm:py-2.5 font-mono text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-white transition-all shrink-0"
            >
              <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
              <span className="hidden sm:inline">Order</span>
            </a>
          ) : (
            <Link
              href={`/${store.slug}/products`}
              className="font-mono text-[11px] tracking-[0.22em] uppercase text-white/85 hover:text-white shrink-0"
            >
              Shop →
            </Link>
          )}
        </div>

        {/* Mobile sub-nav — same editorial mono treatment */}
        <div className="md:hidden border-t border-white/5">
          <div
            className="mx-auto max-w-7xl px-4 sm:px-6 h-10 flex items-center gap-6 font-mono text-[10px] tracking-[0.22em] uppercase text-white/65"
            aria-label="Primary mobile"
          >
            <Link href={`/${store.slug}`} className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href={`/${store.slug}/products`} className="hover:text-white transition-colors">
              Shop
            </Link>
          </div>
        </div>
      </ScrollHeader>

      <main className="relative flex-1">{children}</main>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-[#080807]/95 mt-0">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-400/[0.07] blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-3">
              <StorefrontLogo storeName={store.name} src={logoUrl} size="md" />
              <p className="font-serif text-xl tracking-tight text-white">
                {store.name}<span className="text-amber-200/90">.</span>
              </p>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Modern shopping experience powered by direct WhatsApp orders. No checkout, no friction.
            </p>
          </div>

          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-200/65 font-semibold mb-4">Shop</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={`/${store.slug}`} className="text-white/55 hover:text-white transition-colors">Home</Link></li>
              <li><Link href={`/${store.slug}/products`} className="text-white/55 hover:text-white transition-colors">All products</Link></li>
            </ul>
          </div>

          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-200/65 font-semibold mb-4">Contact</p>
            <ul className="space-y-2.5 text-sm">
              {store.phone && (
                <li>
                  <a href={`tel:${store.phone}`} className="text-white/55 hover:text-white transition-colors">
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
                    className="inline-flex items-center gap-1.5 text-white/55 hover:text-white transition-colors"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
                    WhatsApp
                  </a>
                </li>
              )}
              {store.address && <li className="text-white/55">{store.address}</li>}
            </ul>
          </div>
        </div>

        <div className="relative border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/35">
            <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp FAB (desktop only — mobile already has header CTA / page CTAs) */}
      {whatsAppUrl && <WhatsAppFab url={whatsAppUrl} />}
    </div>
  )
}
