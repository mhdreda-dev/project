import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard')

  return <ReportsClient />
}
