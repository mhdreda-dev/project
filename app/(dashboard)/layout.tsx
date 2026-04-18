import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
