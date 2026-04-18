'use client'

import { usePathname } from 'next/navigation'
import { MobileSidebar } from '@/components/dashboard/sidebar'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/brands': 'Brands',
  '/stock': 'Stock Movements',
  '/stock/low': 'Low Stock',
  '/users': 'Users',
  '/logs': 'Activity Logs',
  '/reports': 'Reports',
}

export function Topbar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const title =
    Object.entries(pageTitles)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => pathname.startsWith(path))?.[1] ?? 'StockMaster'

  return (
    <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40 flex items-center px-4 gap-4">
      <MobileSidebar />

      <div className="flex-1">
        <h2 className="font-semibold text-slate-900 text-base">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
          {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  )
}
