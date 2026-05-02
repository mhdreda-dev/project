import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { storesService } from '@/modules/stores/stores.service'
import { StoresClient } from './stores-client'

export const dynamic = 'force-dynamic'

export default async function StoresPage() {
  const session = await auth()
  if (session?.user?.role !== 'SUPER_ADMIN') redirect('/dashboard')

  const stores = await storesService.list()
  return <StoresClient initialStores={stores as any} />
}
