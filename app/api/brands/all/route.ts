import { auth } from '@/lib/auth'
import { brandsService } from '@/modules/brands/brands.service'
import { apiSuccess, apiError } from '@/lib/utils'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)
    const brands = await brandsService.listAll()
    return apiSuccess(brands)
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Failed to fetch brands')
  }
}
