import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicStore } from '@/lib/storefront/storefront.service'

type Props = {
  children: React.ReactNode
  params: { storeSlug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getPublicStore(params.storeSlug)
  if (!store) return { title: 'Store not found' }
  return {
    title: store.name,
    description: `Shop at ${store.name}`,
  }
}

export default async function StorefrontLayout({ children, params }: Props) {
  const store = await getPublicStore(params.storeSlug)
  if (!store) notFound()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a
            href={`/${store.slug}`}
            className="text-xl font-bold text-slate-900 tracking-tight hover:text-slate-700 transition-colors"
          >
            {store.name}
          </a>
          <nav className="flex items-center gap-6">
            <a
              href={`/${store.slug}/products`}
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Products
            </a>
            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors hidden sm:block"
              >
                {store.phone}
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-slate-400">
          {store.address && <p className="mb-1">{store.address}</p>}
          <p>&copy; {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
