import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
  className?: string
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-600 text-white',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-600 text-white',
    trend: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500 text-white',
    trend: 'text-amber-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-500 text-white',
    trend: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-600 text-white',
    trend: 'text-purple-600',
  },
}

export function StatCard({ title, value, description, icon: Icon, trend, color = 'blue', className }: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div className={cn('bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
          {description && (
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          )}
          {trend && (
            <p className={cn('text-xs font-medium mt-1', colors.trend)}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shadow-sm', colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
