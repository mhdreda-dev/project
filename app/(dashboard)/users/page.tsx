import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { usersService } from '@/modules/users/users.service'
import { UsersClient } from './users-client'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string }
}) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard')

  const page = Number(searchParams.page ?? 1)
  const search = searchParams.search

  const { users, meta } = await usersService.list({ page, limit: 20, search })

  return <UsersClient users={users} meta={meta} currentUserId={session.user.id} />
}
