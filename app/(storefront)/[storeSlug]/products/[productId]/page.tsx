import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerI18n } from '@/lib/i18n/server'
import { getPublicStore, getPublicProduct, getRelatedPublicProducts } from '@/lib/storefront/storefront.service'
import { buildProductWhatsAppUrl } from '@/lib/storefront/whatsapp'
import { RelatedProducts } from '../../_components/related-products'
import { ProductDetailInteractive } from './product-detail-interactive'

export const dynamic = 'force-dynamic'

type Props = {
  params: { storeSlug: string; productId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getPublicStore(params.storeSlug)
  if (!store) return {}
  const product = await getPublicProduct(store.id, params.productId)
  if (!product) return {}
  const variantImage = product.variants?.find((variant: any) => variant.imageUrl)?.imageUrl
  const imageUrl = variantImage ?? product.imageUrl
  return {
    title: product.name,
    description: product.description ?? `${product.name} at ${store.name}`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const store = await getPublicStore(params.storeSlug)
  if (!store) notFound()

  const product = await getPublicProduct(store.id, params.productId)
  if (!product) notFound()

  const { t } = getServerI18n()
  const relatedProducts = await getRelatedPublicProducts(store.id, product, 8)
  const whatsAppUrl = buildProductWhatsAppUrl(store, product)
  const formattedPrice = product.price.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  })

  return (
    <>
      <ProductDetailInteractive
        store={store}
        product={product as any}
        whatsAppUrl={whatsAppUrl}
        formattedPrice={formattedPrice}
      />
      <RelatedProducts
        products={relatedProducts as any}
        storeSlug={store.slug}
        eyebrow={t('storefront.relatedProducts.eyebrow')}
        title={t('storefront.relatedProducts.title')}
        description={t('storefront.relatedProducts.description')}
        viewAllLabel={t('storefront.relatedProducts.viewAll')}
      />
    </>
  )
}
