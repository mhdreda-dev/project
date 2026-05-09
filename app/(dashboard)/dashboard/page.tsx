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
  Target,
  Trophy,
  CalendarDays,
  Coins,
} from 'lucide-react'
import { DashboardChart } from '@/components/dashboard/dashboard-chart'
import { getServerI18n } from '@/lib/i18n/server'
import { getSessionStoreId } from '@/lib/store-context'

export default async function DashboardPage() {
  const session = await auth()
  const { t } = getServerI18n()
  const isAdmin = session?.user?.role === 'ADMIN'
  const scope = { storeId: getSessionStoreId(session) }

  const [stats, lowStock, recentMovements, rewardSummary, walletSummary, employeeWallets] = await Promise.all([
    isAdmin ? productsService.getDashboardStats(scope) : productsService.getOperationalDashboardStats(scope),
    reportsService.getLowStockProducts(scope),
    reportsService.getRecentStockMovements(scope, 5, isAdmin ? undefined : session?.user?.id),
    rewardsService.getEmployeeSummary(session?.user?.id ?? '', scope),
    rewardsService.getEmployeeWalletDashboard(session?.user?.id ?? '', scope),
    isAdmin ? rewardsService.getEmployeeWalletOverview(scope) : Promise.resolve([]),
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

      {isAdmin ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white lg:col-span-1">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Commission control</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">
                      {formatCurrency(employeeWallets.reduce((sum, employee) => sum + employee.pendingPayoutMAD, 0))}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">Pending payout across employees in this store.</p>
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
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Employee Sales Wallets
                </CardTitle>
                <CardDescription>Store-scoped commission from recorded product sales. Payout tracking can be added later.</CardDescription>
              </CardHeader>
              <CardContent>
                {employeeWallets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No employee sales activity yet.</p>
                ) : (
                  <div className="divide-y">
                    {employeeWallets.slice(0, 5).map((employee) => (
                      <div key={employee.id} className="grid gap-3 py-3 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] md:items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{employee.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                        </div>
                        <WalletMetric label="This week" value={formatCurrency(employee.salesAmountThisWeek)} />
                        <WalletMetric label="Sold today" value={employee.soldToday.toLocaleString()} />
                        <WalletMetric label="Commission earned" value={formatCurrency(employee.walletBalanceMAD)} strong />
                        <WalletMetric label="Weekly target" value={`${employee.weeklyProgressPercent}%`} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <EmployeeWalletCard
              label="Sold today"
              value={walletSummary.soldToday.toLocaleString()}
              description={`${formatCurrency(walletSummary.salesAmountToday)} sales amount today`}
              icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
            />
            <EmployeeWalletCard
              label="This week"
              value={walletSummary.soldThisWeek.toLocaleString()}
              description={`${formatCurrency(walletSummary.salesAmountThisWeek)} sales amount this week`}
              icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            />
            <EmployeeWalletCard
              label="My Wallet"
              value={formatCurrency(walletSummary.walletBalanceMAD)}
              description={`${formatCurrency(walletSummary.pendingPayoutMAD)} pending payout`}
              icon={<Wallet className="h-5 w-5 text-emerald-700" />}
              highlight
            />
            <EmployeeWalletCard
              label="Commission earned"
              value={formatCurrency(walletSummary.commissionThisWeekMAD)}
              description={`${formatCurrency(walletSummary.commissionTodayMAD)} earned today`}
              icon={<Coins className="h-5 w-5 text-amber-600" />}
            />
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Weekly target
                </CardTitle>
                <CardDescription>
                  You reached {walletSummary.weeklyProgressPercent}% of your weekly target.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(walletSummary.salesAmountThisWeek)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Goal: {formatCurrency(walletSummary.weeklyTargetMAD)}
                    </p>
                  </div>
                  <Badge variant={walletSummary.weeklyProgressPercent >= 100 ? 'success' : 'secondary'}>
                    {walletSummary.weeklyProgressPercent}%
                  </Badge>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                    style={{ width: `${walletSummary.weeklyProgressPercent}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4 text-emerald-600" />
                Recent commission activity
              </CardTitle>
              <CardDescription>Your own sales commission events only.</CardDescription>
            </CardHeader>
            <CardContent>
              {walletSummary.latestSales.length === 0 ? (
                <p className="text-sm text-muted-foreground">No commission activity yet. Your next sale will appear here.</p>
              ) : (
                <div className="space-y-3">
                  {walletSummary.latestSales.map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Product sold</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {event.product?.name ?? 'Archived product'} · Qty {event.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-emerald-700">+{formatCurrency(event.rewardAmountMAD)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats cards */}
      <div className={`grid gap-4 md:grid-cols-2 ${isAdmin ? 'xl:grid-cols-5' : 'xl:grid-cols-3'}`}>
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
        {isAdmin && (
          <>
            <StatCard
              title={t('dashboard.stats.inventoryValueMad')}
              value={formatCurrency((stats as { totalInventoryValue?: number }).totalInventoryValue ?? 0)}
              description={t('dashboard.stats.atRetailPrice')}
              icon={<DollarSign className="h-5 w-5 text-purple-600" />}
              color="purple"
            />
            <StatCard
              title={t('dashboard.stats.expectedProfit')}
              value={formatCurrency((stats as { expectedProfit?: number }).expectedProfit ?? 0)}
              description={t('dashboard.stats.retailMinusCost')}
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
              color="green"
            />
          </>
        )}
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

function WalletMetric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={strong ? 'text-sm font-semibold text-emerald-700' : 'text-sm font-medium'}>{value}</p>
    </div>
  )
}

function EmployeeWalletCard({
  label,
  value,
  description,
  icon,
  highlight,
}: {
  label: string
  value: string
  description: string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">{icon}</div>
        </div>
      </CardContent>
    </Card>
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
