'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartPoint {
  date: string
  in_qty: number
  out_qty: number
}

export function DashboardChart() {
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stock/chart?days=30')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stock Movement Trend</CardTitle>
        <CardDescription>Last 30 days — inbound vs outbound</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
            Loading chart...
          </div>
        ) : data.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
            No movement data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="in_qty"
                name="Stock In"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorIn)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="out_qty"
                name="Stock Out"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorOut)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
