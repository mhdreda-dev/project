import { stockService } from '@/modules/stock/stock.service'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function LowStockPage() {
  const items = await stockService.getLowStock()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
          <p className="text-muted-foreground mt-1">{items.length} items need restocking</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">All stock levels are healthy. No alerts.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Items Below Minimum Stock</CardTitle>
            <CardDescription>Reorder these items as soon as possible</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {items.map((item) => {
                const urgency = item.quantity === 0 ? 'destructive' : 'warning'
                return (
                  <div key={item.id} className="py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.product.sku} · Size: {item.size}
                        {item.product.category && ` · ${item.product.category}`}
                      </p>
                    </div>
                    <div className="text-sm text-right space-y-1">
                      <div>
                        <Badge variant={urgency}>
                          {item.quantity === 0 ? 'OUT OF STOCK' : `${item.quantity} left`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Threshold: {item.minQuantity}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
