'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  Users,
  ClipboardList,
  LogOut,
  Package2,
  AlertTriangle,
  Tag,
  BarChart3,
  Bot,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useI18n } from '@/components/i18n-provider'

type NavItem = {
  href: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

type NavGroup = { labelKey: string; items: NavItem[] }

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = useI18n()
  const isAdmin = session?.user?.role === 'ADMIN'

  const navGroups: NavGroup[] = [
    {
      labelKey: 'shell.sidebar.overview',
      items: [
        { href: '/dashboard', labelKey: 'shell.sidebar.dashboard', icon: LayoutDashboard },
        { href: '/reports', labelKey: 'shell.sidebar.reports', icon: BarChart3 },
        { href: '/ai-requests', labelKey: 'shell.sidebar.aiRequests', icon: Bot, adminOnly: true },
      ],
    },
    {
      labelKey: 'shell.sidebar.inventory',
      items: [
        { href: '/products', labelKey: 'shell.sidebar.products', icon: Package },
        { href: '/brands', labelKey: 'shell.sidebar.brands', icon: Tag },
        { href: '/stock', labelKey: 'shell.sidebar.stock', icon: ArrowRightLeft },
        { href: '/stock/low', labelKey: 'shell.sidebar.lowStock', icon: AlertTriangle },
      ],
    },
    {
      labelKey: 'shell.sidebar.administration',
      items: [
        { href: '/users', labelKey: 'shell.sidebar.users', icon: Users, adminOnly: true },
        { href: '/logs', labelKey: 'shell.sidebar.logs', icon: ClipboardList, adminOnly: true },
      ],
    },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
          <Package2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-slate-900 text-base tracking-tight">StockMaster</span>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            {t('shell.brand.subtitle')}
          </p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin)
          if (!visibleItems.length) return null

          return (
            <div key={group.labelKey}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {t(group.labelKey)}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )}
                      >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-transform',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600',
                        )}
                      />
                      <span className="flex-1">{t(item.labelKey)}</span>
                      {isActive && <ChevronRight className="h-3 w-3 text-blue-200" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 mb-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm">
            {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{session?.user?.name}</p>
            <Badge
              variant={isAdmin ? 'default' : 'secondary'}
              className={cn(
                'text-[10px] px-1.5 py-0 font-medium',
                isAdmin ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : '',
              )}
            >
              {session?.user?.role === 'ADMIN' ? t('common.roles.admin') : t('common.roles.employee')}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('common.actions.signOut')}
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-100 bg-white flex-col shadow-sm">
        <NavContent />
      </aside>

      {/* Mobile trigger (rendered by Topbar) */}
    </>
  )
}

export function MobileSidebar() {
  const { t } = useI18n()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t('common.actions.openMenu')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <NavContent />
      </SheetContent>
    </Sheet>
  )
}
