import { redirect } from 'next/navigation'
import type { ComponentType } from 'react'
import { Bot, Inbox, Search, TrendingUp, UserRound, XCircle } from 'lucide-react'
import { auth } from '@/lib/auth'
import { aiSalesService } from '@/modules/ai/ai-sales.service'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string | number
  description: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className="rounded-md bg-slate-100 p-2 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-950">{value}</div>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </CardContent>
    </Card>
  )
}

export default async function AiRequestsPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard')

  const { stats, recentRequests, recentLeads, topProducts, unavailableProducts } =
    await aiSalesService.getDashboard()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">AI Sales Requests</h1>
              <p className="text-sm text-slate-500">Customer demand, leads, and missed product opportunities.</p>
            </div>
          </div>
        </div>
        <Badge variant="info" className="w-fit">Website agent</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total requests" value={stats.totalRequests} description="All AI sales conversations" icon={Inbox} />
        <StatCard title="Leads captured" value={stats.totalLeads} description="Messages with contact or purchase intent" icon={UserRound} />
        <StatCard title="Unavailable" value={stats.unavailableCount} description="Requests without exact stock match" icon={XCircle} />
        <StatCard title="Lead rate" value={`${stats.conversionRate}%`} description="Leads from AI requests" icon={TrendingUp} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Searched Products</CardTitle>
            <CardDescription>Most frequent product/category terms customers ask for.</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No AI searches yet.</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((item) => (
                  <div key={item.requestedProduct ?? 'unknown'} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-800">{item.requestedProduct}</span>
                    </div>
                    <Badge variant="secondary">{item._count.requestedProduct}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requested But Unavailable</CardTitle>
            <CardDescription>Real demand that did not find an exact in-stock match.</CardDescription>
          </CardHeader>
          <CardContent>
            {unavailableProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No unavailable requests yet.</p>
            ) : (
              <div className="space-y-3">
                {unavailableProducts.map((item) => (
                  <div
                    key={`${item.requestedProduct}-${item.requestedSize}-${item.requestedColor}`}
                    className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{item.requestedProduct}</p>
                      <Badge variant="warning">{item._count.id}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      {[item.requestedCategory, item.requestedSize && `size ${item.requestedSize}`, item.requestedColor]
                        .filter(Boolean)
                        .join(' · ') || 'No extra attributes'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent AI Requests</CardTitle>
            <CardDescription>Latest customer questions and saved intent.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No conversations yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentRequests.map((request) => (
                  <div key={request.id} className="py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-slate-900">{request.message}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{request.answer}</p>
                      </div>
                      <Badge variant={request.isUnavailable ? 'warning' : 'success'} className="w-fit shrink-0">
                        {request.isUnavailable ? 'Unavailable' : 'Matched'}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      {request.requestedProduct && <Badge variant="outline">{request.requestedProduct}</Badge>}
                      {request.requestedSize && <Badge variant="outline">size {request.requestedSize}</Badge>}
                      {request.requestedColor && <Badge variant="outline">{request.requestedColor}</Badge>}
                      {request.matchedProduct && (
                        <Badge variant="info">
                          matched {[request.matchedProduct.brand?.name, request.matchedProduct.name].filter(Boolean).join(' ')}
                        </Badge>
                      )}
                      <span className="ml-auto">{formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interested Customers</CardTitle>
            <CardDescription>Leads captured from contact details or purchase intent.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No leads yet.</p>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="rounded-md border border-slate-100 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{lead.name || lead.phone || lead.email || 'Interested customer'}</p>
                        <p className="mt-1 text-xs text-slate-500">{[lead.phone, lead.email].filter(Boolean).join(' · ') || 'No contact saved'}</p>
                      </div>
                      <Badge variant="info">{lead.status}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{lead.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(lead.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
