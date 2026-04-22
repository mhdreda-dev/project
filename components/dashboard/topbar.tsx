'use client'

import { usePathname } from 'next/navigation'
import { MobileSidebar } from '@/components/dashboard/sidebar'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useI18n } from '@/components/i18n-provider'
import { LanguageSwitcher } from '@/components/dashboard/language-switcher'

export function Topbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = useI18n()

  const pageTitles: Record<string, string> = {
    '/dashboard': t('shell.sidebar.dashboard'),
    '/products': t('shell.sidebar.products'),
    '/brands': t('shell.sidebar.brands'),
    '/stock': t('shell.sidebar.stock'),
    '/stock/low': t('shell.sidebar.lowStock'),
    '/users': t('shell.sidebar.users'),
    '/logs': t('shell.sidebar.logs'),
    '/reports': t('shell.sidebar.reports'),
  }

  const title =
    Object.entries(pageTitles)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => pathname.startsWith(path))?.[1] ?? t('shell.topbar.defaultTitle')

  return (
    <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40 flex items-center px-4 gap-3">
      <MobileSidebar />

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold text-slate-900 text-base">{title}</h2>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <LanguageSwitcher />
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
