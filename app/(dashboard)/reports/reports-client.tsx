'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
} from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useI18n } from '@/components/i18n-provider'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Period = 'day' | 'week' | 'month' | 'year'

export function ReportsClient() {
  const [period, setPeriod] = useState<Period>('month')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useI18n()

  const periods: { value: Period; label: string }[] = [
    { value: 'day', label: t('reports.periods.day') },
    { value: 'week', label: t('reports.periods.week') },
    { value: 'month', label: t('reports.periods.month') },
    { value: 'year', label: t('reports.periods.year') },
  ]

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?period=${period}`)
      const json = await res.json()
      setData(json.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { fetchReport() }, [fetchReport])

  const summary = data?.summary
  const timeline = data?.timeline ?? []
  const topProducts = data?.topProducts ?? []
  const brandDistribution = data?.brandDistribution ?? data?.topBrands ?? []
  const lowStock = data?.lowStock ?? []
  const recentMovements = data?.recentMovements ?? []

  return (
    <div>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
      />

      {/* Period selector */}
      <div className="flex gap-2 mb-6 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              period === p.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-28 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
              <div className="h-7 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Inventory summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
            <StatCard
              title={t('reports.stats.totalProducts')}
              value={(summary?.totalProducts ?? 0).toLocaleString()}
              description={t('dashboard.stats.activeProducts')}
              icon={Package}
              color="blue"
            />
            <StatCard
              title={t('reports.stats.totalUnits')}
              value={(summary?.totalUnits ?? 0).toLocaleString()}
              description={t('dashboard.stats.unitsAcross')}
              icon={Activity}
              color="green"
            />
            <StatCard
              title={t('reports.stats.retailValueMad')}
              value={formatCurrency(summary?.retailValue ?? summary?.inventoryValue ?? 0)}
              description={t('reports.stats.totalRetailValue')}
              icon={DollarSign}
              color="purple"
            />
            <StatCard
              title={t('reports.stats.costValueMad')}
              value={formatCurrency(summary?.costValue ?? 0)}
              description={t('reports.stats.totalCostValue')}
              icon={BarChart3}
              color="amber"
            />
            <StatCard
              title={t('reports.stats.expectedProfit')}
              value={formatCurrency(summary?.expectedProfit ?? 0)}
              description={t('reports.stats.retailMinusCost')}
              icon={TrendingUp}
              color="green"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <StatCard
              title={t('reports.stats.lowStockItems')}
              value={summary?.lowStockCount ?? 0}
              description={t('reports.stats.needRestocking')}
              icon={AlertTriangle}
              color="red"
            />
            <StatCard
              title={t('reports.stats.stockIn')}
              value={(summary?.totalStockIn ?? 0).toLocaleString()}
              description={t('reports.stats.unitsReceived')}
              icon={ArrowUpCircle}
              color="green"
            />
            <StatCard
              title={t('reports.stats.stockOut')}
              value={(summary?.totalStockOut ?? 0).toLocaleString()}
              description={t('reports.stats.unitsDispatched')}
              icon={ArrowDownCircle}
              color="blue"
            />
          </div>

          {/* Timeline chart */}
          {timeline.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6">
              <h3 className="font-semibold text-slate-900 mb-4">{t('reports.timeline.title')}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="in" name={t('reports.stats.stockIn')} stroke="#10b981" fill="url(#colorIn)" strokeWidth={2} />
                  <Area type="monotone" dataKey="out" name={t('reports.stats.stockOut')} stroke="#3b82f6" fill="url(#colorOut)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {/* Top products by inventory value */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">{t('reports.topProducts.title')}</h3>
              {topProducts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">{t('reports.emptyPeriod')}</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.slice(0, 8).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-5 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.product?.name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{item.product?.brand?.name ?? t('common.labels.noBrand')} · {item.product?.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-800 tabular-nums">{formatCurrency(item.retailValue ?? 0)}</p>
                        <p className="text-xs text-slate-400">{t('common.misc.units', { count: item.totalUnits ?? 0 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Brand distribution */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">{t('reports.topBrands.title')}</h3>
              {brandDistribution.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">{t('reports.emptyPeriod')}</p>
              ) : (
                <div className="space-y-3">
                  {brandDistribution.map((brand: any, i: number) => {
                    const max = brandDistribution[0]?.retailValue ?? 1
                    const pct = Math.round(((brand.retailValue ?? 0) / max) * 100)
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-800">{brand.name}</span>
                          <span className="text-slate-500 tabular-nums">{formatCurrency(brand.retailValue ?? 0)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400">
                          {t('common.misc.units', { count: brand.totalUnits ?? 0 })} · {brand.productCount ?? 0} {t('reports.brandDistribution.products')}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Low stock table */}
          {lowStock.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-slate-900">{t('reports.lowStock.title')}</h3>
                <Badge variant="warning" className="text-xs">{lowStock.length}</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 px-3 font-medium text-slate-500">{t('reports.lowStock.product')}</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-500">{t('reports.lowStock.brand')}</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-500">{t('reports.lowStock.size')}</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-500">{t('reports.lowStock.stock')}</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-500">{t('reports.lowStock.min')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.slice(0, 10).map((item: any) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.product.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{item.product.brand?.name ?? '—'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{item.size ?? 'All'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge variant="destructive" className="text-xs tabular-nums">{item.totalQty ?? item.quantity}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 tabular-nums">{item.minQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent movements */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-slate-900">{t('reports.recentMovements.title')}</h3>
            </div>
            {recentMovements.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">{t('reports.emptyPeriod')}</p>
            ) : (
              <div className="space-y-0 divide-y divide-slate-50">
                {recentMovements.map((m: any) => (
                  <div key={m.id} className="py-3 flex items-center gap-4">
                    <div className="shrink-0">
                      {m.type === 'IN' ? (
                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                      ) : m.type === 'OUT' ? (
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {m.product.name} · {m.productSize.size}
                      </p>
                      <p className="text-xs text-slate-400">{m.user.name} · {formatDate(m.createdAt)}</p>
                    </div>
                    <Badge variant={m.type === 'OUT' ? 'destructive' : m.type === 'IN' ? 'success' : 'info'} className="text-xs tabular-nums shrink-0">
                      {m.type === 'OUT' ? '-' : m.type === 'IN' ? '+' : '='}{m.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
