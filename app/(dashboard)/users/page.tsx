import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { usersService } from '@/modules/users/users.service'
import { rewardsService } from '@/modules/rewards/rewards.service'
import { UsersClient } from './users-client'
import { getSessionStoreId } from '@/lib/store-context'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string }
}) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard')
  const scope = { storeId: getSessionStoreId(session) }

  const page = Number(searchParams.page ?? 1)
  const search = searchParams.search

  const [{ users, meta }, rewardLeaderboard] = await Promise.all([
    usersService.list({ page, limit: 20, search }, scope),
    rewardsService.getLeaderboard(scope),
  ])

  return <UsersClient users={users} meta={meta} currentUserId={session.user.id} rewardLeaderboard={rewardLeaderboard} />
}
