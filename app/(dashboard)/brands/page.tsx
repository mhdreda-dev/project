import { auth } from '@/lib/auth'
import { brandsService } from '@/modules/brands/brands.service'
import { BrandsClient } from './brands-client'

export default async function BrandsPage() {
  const session = await auth()
  const { brands } = await brandsService.list({ page: 1, limit: 100 })

  return <BrandsClient initialBrands={brands as any} isAdmin={session?.user?.role === 'ADMIN'} />
}
