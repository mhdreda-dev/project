import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getSessionStoreId } from '@/lib/store-context'
import { storesService } from '@/modules/stores/stores.service'
import { StoreSettingsClient } from './store-settings-client'

export const dynamic = 'force-dynamic'

export default async function StoreSettingsPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const store = await storesService.findSettings(getSessionStoreId(session))
  if (!store) redirect('/dashboard')

  return <StoreSettingsClient initialStore={store} />
}
