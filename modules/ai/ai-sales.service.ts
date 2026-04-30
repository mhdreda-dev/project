import { db } from '@/lib/db'

export const aiSalesService = {
  async getDashboard() {
    const [totalRequests, totalLeads, unavailableCount, recentRequests, recentLeads, topProducts, unavailableProducts] =
      await Promise.all([
        db.aiConversation.count(),
        db.aiLead.count(),
        db.aiConversation.count({ where: { isUnavailable: true } }),
        db.aiConversation.findMany({
          take: 30,
          orderBy: { createdAt: 'desc' },
          include: {
            matchedProduct: {
              select: {
                name: true,
                brand: { select: { name: true } },
              },
            },
          },
        }),
        db.aiLead.findMany({
          take: 12,
          orderBy: { createdAt: 'desc' },
        }),
        db.aiConversation.groupBy({
          by: ['requestedProduct'],
          where: { requestedProduct: { not: null } },
          _count: { requestedProduct: true },
          orderBy: { _count: { requestedProduct: 'desc' } },
          take: 8,
        }),
        db.aiConversation.groupBy({
          by: ['requestedProduct', 'requestedCategory', 'requestedSize', 'requestedColor'],
          where: { isUnavailable: true, requestedProduct: { not: null } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 8,
        }),
      ])

    return {
      stats: {
        totalRequests,
        totalLeads,
        unavailableCount,
        conversionRate: totalRequests ? Math.round((totalLeads / totalRequests) * 100) : 0,
      },
      recentRequests,
      recentLeads,
      topProducts,
      unavailableProducts,
    }
  },
}
