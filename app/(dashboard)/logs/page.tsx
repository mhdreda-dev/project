import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { logsService } from '@/modules/logs/logs.service'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { ClipboardList } from 'lucide-react'
import { getServerI18n } from '@/lib/i18n/server'

const actionColor: Record<string, 'default' | 'success' | 'destructive' | 'info' | 'warning' | 'secondary' | 'outline'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'destructive',
  LOGIN: 'secondary',
  LOGOUT: 'secondary',
  STOCK_IN: 'success',
  STOCK_OUT: 'warning',
  STOCK_ADJUST: 'info',
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard')
  const { t } = getServerI18n()

  const page = Number(searchParams.page ?? 1)
  const { logs, meta } = await logsService.list({ page, limit: 30 })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('logs.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('logs.description', { count: meta.total })}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('logs.allActivity')}</CardTitle>
          <CardDescription>{t('common.misc.pageOf', { page: meta.page, total: meta.totalPages })}</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-8">{t('logs.empty')}</p>
          ) : (
            <div className="divide-y font-mono text-sm">
              {logs.map((log) => (
                <div key={log.id} className="py-3 flex items-start gap-4">
                  <Badge variant={actionColor[log.action] ?? 'outline'} className="shrink-0 text-xs mt-0.5">
                    {log.action}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <span className="text-muted-foreground">{log.entity}</span>
                    {log.entityId && (
                      <span className="text-muted-foreground/60"> #{log.entityId.slice(-6)}</span>
                    )}
                    {log.user && (
                      <span className="ml-2 text-foreground font-medium">
                        {t('common.misc.byUser', { name: log.user.name })}
                      </span>
                    )}
                    {log.ipAddress && (
                      <span className="ml-2 text-xs text-muted-foreground/60">({log.ipAddress})</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('common.misc.pageOf', { page: meta.page, total: meta.totalPages })}</p>
          <div className="flex gap-2">
            <a href={`/logs?page=${meta.page - 1}`}>
              <button className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50" disabled={!meta.hasPrev}>{t('common.actions.previous')}</button>
            </a>
            <a href={`/logs?page=${meta.page + 1}`}>
              <button className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50" disabled={!meta.hasNext}>{t('common.actions.next')}</button>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
