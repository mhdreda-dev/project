import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
import { reportsService } from '@/modules/reports/reports.service'
import { rewardsService } from '@/modules/rewards/rewards.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Wallet,
  Gift,
} from 'lucide-react'
import { DashboardChart } from '@/components/dashboard/dashboard-chart'
import { getServerI18n } from '@/lib/i18n/server'

export default async function DashboardPage() {
  const session = await auth()
  const { t } = getServerI18n()

  const [stats, lowStock, recentMovements, rewardSummary] = await Promise.all([
    productsService.getDashboardStats(),
    reportsService.getLowStockProducts(),
    reportsService.getRecentStockMovements(5),
    rewardsService.getEmployeeSummary(session?.user?.id ?? ''),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('dashboard.welcome', { name: session?.user?.name ?? '—' })}
        </p>
      </div>

      {/* Rewards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-700">Your reward balance:</p>
                <p className="mt-2 text-3xl font-bold text-slate-950" aria-label={`Your reward balance: ${formatCurrency(rewardSummary.totalRewardsMAD)}`}>
                  {formatCurrency(rewardSummary.totalRewardsMAD)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Earned from product adds and sales.</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2.5">
                <Wallet className="h-5 w-5 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-4 w-4 text-emerald-600" />
              Employee Rewards
            </CardTitle>
            <CardDescription>Rewards are tracked in MAD for each product added or sold.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <RewardMetric label="Rewards today" value={formatCurrency(rewardSummary.rewardsTodayMAD)} />
              <RewardMetric label="Products added" value={rewardSummary.productsAddedCount.toLocaleString()} />
              <RewardMetric label="Products sold" value={rewardSummary.productsSoldCount.toLocaleString()} />
            </div>

            <div className="mt-5 space-y-3">
              {rewardSummary.latestEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reward events yet.</p>
              ) : (
                rewardSummary.latestEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {event.actionType === 'PRODUCT_ADDED' ? 'Product added' : 'Product sold'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.product?.name ?? 'Archived product'} · Qty {event.quantity}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-emerald-700">
                        +{formatCurrency(event.rewardAmountMAD)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title={t('dashboard.stats.totalProducts')}
          value={stats.totalProducts.toLocaleString()}
          description={t('dashboard.stats.activeProducts')}
          icon={<Package className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title={t('dashboard.stats.totalUnits')}
          value={stats.totalUnits.toLocaleString()}
          description={t('dashboard.stats.unitsAcross')}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <StatCard
          title={t('dashboard.stats.inventoryValueMad')}
          value={formatCurrency(stats.totalInventoryValue)}
          description={t('dashboard.stats.atRetailPrice')}
          icon={<DollarSign className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
        <StatCard
          title={t('dashboard.stats.expectedProfit')}
          value={formatCurrency(stats.expectedProfit)}
          description={t('dashboard.stats.retailMinusCost')}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <StatCard
          title={t('dashboard.stats.lowStockAlerts')}
          value={stats.lowStockCount.toLocaleString()}
          description={t('dashboard.stats.needRestocking')}
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          color="orange"
          alert={stats.lowStockCount > 0}
        />
      </div>

      {/* Chart + Low Stock */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardChart />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {t('dashboard.lowStock.title')}
            </CardTitle>
            <CardDescription>{t('dashboard.lowStock.count', { count: lowStock.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.lowStock.allHealthy')}</p>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('common.labels.sizeSku', { size: item.size, sku: item.product.sku })}
                      </p>
                    </div>
                    <Badge variant="warning" className="ml-2 shrink-0">
                      {t('common.misc.leftCount', { count: item.quantity })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.recent.title')}</CardTitle>
          <CardDescription>{t('dashboard.recent.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMovements.map((m) => (
              <div key={m.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                <div className="shrink-0">
                  {m.type === 'IN' ? (
                    <ArrowUpCircle className="h-5 w-5 text-green-500" />
                  ) : m.type === 'OUT' ? (
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {t('dashboard.recent.size', { product: m.product.name, size: m.productSize.size })}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('common.misc.byUser', { name: m.user.name })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">
                    {t('dashboard.recent.units', {
                      sign: m.type === 'OUT' ? '-' : '+',
                      count: m.quantity,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RewardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon,
  color,
  alert,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
  alert?: boolean
}) {
  const bgMap = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
  }

  return (
    <Card className={alert ? 'border-orange-200' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-2.5 rounded-lg ${bgMap[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
