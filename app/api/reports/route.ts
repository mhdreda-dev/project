import { auth } from '@/lib/auth'
import { reportsService, ReportPeriod } from '@/modules/reports/reports.service'
import { apiSuccess, apiError } from '@/lib/utils'
import { NextRequest } from 'next/server'
import { getSessionStoreId } from '@/lib/store-context'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)
    const scope = { storeId: getSessionStoreId(session) }

    const { searchParams } = req.nextUrl
    const period = (searchParams.get('period') ?? 'month') as ReportPeriod
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
    const query = { period, from, to }

    const [summary, topProducts, brandDistribution, timeline, lowStock, recentMovements] = await Promise.all([
      reportsService.getSummary(query, scope),
      reportsService.getTopProductsByValue(scope),
      reportsService.getBrandDistribution(scope),
      reportsService.getMovementTimeline(query, scope),
      reportsService.getLowStockProducts(scope),
      reportsService.getRecentStockMovements(scope),
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
