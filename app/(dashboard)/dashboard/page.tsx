import { auth } from '@/lib/auth'
import { productsService } from '@/modules/products/products.service'
import { stockService } from '@/modules/stock/stock.service'
import { db } from '@/lib/db'
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
} from 'lucide-react'
import { DashboardChart } from '@/components/dashboard/dashboard-chart'

export default async function DashboardPage() {
  const session = await auth()

  const [stats, lowStock, recentMovements] = await Promise.all([
    productsService.getDashboardStats(),
    stockService.getLowStock(),
    db.stockMovement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        productSize: { select: { size: true } },
        user: { select: { name: true } },
      },
    }),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session?.user?.name}. Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          description="Active products"
          icon={<Package className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Total Stock"
          value={stats.totalStock.toLocaleString()}
          description="Units across all sizes"
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(stats.totalInventoryValue)}
          description="At retail price"
          icon={<DollarSign className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockCount.toLocaleString()}
          description="Need restocking"
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
              Low Stock Alerts
            </CardTitle>
            <CardDescription>{lowStock.length} items need attention</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All stock levels are healthy.</p>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Size {item.size} · SKU {item.product.sku}
                      </p>
                    </div>
                    <Badge variant="warning" className="ml-2 shrink-0">
                      {item.quantity} left
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
          <CardTitle className="text-base">Recent Stock Movements</CardTitle>
          <CardDescription>Last 5 transactions</CardDescription>
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
                    {m.product.name} — Size {m.productSize.size}
                  </p>
                  <p className="text-xs text-muted-foreground">by {m.user.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">
                    {m.type === 'OUT' ? '-' : '+'}
                    {m.quantity} units
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
