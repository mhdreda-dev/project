import { auth } from '@/lib/auth'
import { reportsService, ReportPeriod } from '@/modules/reports/reports.service'
import { apiSuccess, apiError } from '@/lib/utils'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)

    const { searchParams } = req.nextUrl
    const period = (searchParams.get('period') ?? 'month') as ReportPeriod
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
    const query = { period, from, to }

    const [summary, topProducts, brandDistribution, timeline, lowStock, recentMovements] = await Promise.all([
      reportsService.getSummary(query),
      reportsService.getTopProductsByValue(),
      reportsService.getBrandDistribution(),
      reportsService.getMovementTimeline(query),
      reportsService.getLowStockProducts(),
      reportsService.getRecentStockMovements(),
    ])

    return apiSuccess({
      summary,
      topProducts,
      brandDistribution,
      topBrands: brandDistribution,
      timeline,
      lowStock,
      recentMovements,
    })
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Failed to generate report')
  }
}
