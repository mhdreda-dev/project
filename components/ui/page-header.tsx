import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center gap-4 mb-6', className)}>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
