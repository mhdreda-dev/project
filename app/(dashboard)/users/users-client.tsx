'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, Shield, User, Loader2, Plus, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Role } from '@prisma/client'
import { useI18n } from '@/components/i18n-provider'

interface UserRecord {
  id: string; name: string; email: string; role: Role;
  isActive: boolean; lastLoginAt: Date | null; createdAt: Date
}

interface PaginationMeta {
  total: number; page: number; totalPages: number; hasNext: boolean; hasPrev: boolean
}

interface RewardLeaderboardRecord {
  id: string
  name: string
  email: string
  totalRewardsMAD: number
  productsAddedCount: number
  productsSoldCount: number
  latestActivity: Date | null
}

export function UsersClient({ users, meta, currentUserId, rewardLeaderboard }: {
  users: UserRecord[]
  meta: PaginationMeta
  currentUserId: string
  rewardLeaderboard: RewardLeaderboardRecord[]
}) {
  const router = useRouter()
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  function applySearch() {
    router.push(`/users?search=${search}`)
  }

  async function toggleActive(user: UserRecord) {
    if (user.id === currentUserId) return
    setToggling(user.id)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: user.isActive ? t('users.toast.deactivated') : t('users.toast.activated') })
      router.refresh()
    } catch (e) {
      toast({ title: t('users.toast.error'), description: (e as Error).message, variant: 'destructive' })
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('users.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('users.description', { count: meta.total })}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('common.actions.inviteUser')}
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.placeholders.searchUsers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={applySearch}>{t('common.actions.search')}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('users.allUsers')}</CardTitle>
          <CardDescription>{t('users.manageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="py-3 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {user.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    {user.id === currentUserId && (
                      <span className="text-xs text-muted-foreground">({t('common.misc.you')})</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {user.role === 'ADMIN' ? (
                    <Badge variant="default" className="gap-1">
                      <Shield className="h-3 w-3" />{t('common.roles.admin')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <User className="h-3 w-3" />{t('common.roles.employee')}
                    </Badge>
                  )}
                  <Badge variant={user.isActive ? 'success' : 'secondary'}>
                    {user.isActive ? t('common.status.active') : t('common.status.inactive')}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 w-28 text-right hidden md:block">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : t('common.misc.neverLoggedIn')}
                </div>
                {user.id !== currentUserId && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={toggling === user.id}
                    onClick={() => toggleActive(user)}
                  >
                    {toggling === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : user.isActive ? t('common.actions.deactivate') : t('common.actions.activate')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Reward Leaderboard
          </CardTitle>
          <CardDescription>Employee rewards earned in MAD from products added and products sold</CardDescription>
        </CardHeader>
        <CardContent>
          {rewardLeaderboard.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-8">No employee reward activity yet.</p>
          ) : (
            <div className="divide-y">
              {rewardLeaderboard.map((employee, index) => (
                <div key={employee.id} className="grid gap-3 py-3 md:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] md:items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-semibold shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{employee.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                    </div>
                  </div>
                  <LeaderboardMetric label="Total MAD earned" value={formatCurrency(employee.totalRewardsMAD)} strong />
                  <LeaderboardMetric label="Products added" value={employee.productsAddedCount.toLocaleString()} />
                  <LeaderboardMetric label="Products sold" value={employee.productsSoldCount.toLocaleString()} />
                  <LeaderboardMetric
                    label="Latest activity"
                    value={employee.latestActivity ? formatDate(employee.latestActivity) : 'No activity'}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('common.misc.pageOf', { page: meta.page, total: meta.totalPages })}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={() => router.push(`/users?page=${meta.page - 1}`)}>{t('common.actions.previous')}</Button>
            <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => router.push(`/users?page=${meta.page + 1}`)}>{t('common.actions.next')}</Button>
          </div>
        </div>
      )}

      <CreateUserDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); router.refresh() }}
      />
    </div>
  )
}

function LeaderboardMetric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={strong ? 'text-sm font-semibold text-emerald-700' : 'text-sm font-medium'}>{value}</p>
    </div>
  )
}

function CreateUserDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { t } = useI18n()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const payload = {
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password'),
      role: 'EMPLOYEE',
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: t('users.toast.created') })
      onSuccess()
    } catch (e) {
      toast({ title: t('users.toast.error'), description: (e as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t('users.createDialog.title')}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>{t('common.labels.fullName')} *</Label>
            <Input name="name" placeholder={t('common.placeholders.fullName')} required />
          </div>
          <div className="space-y-1">
            <Label>{t('common.labels.email')} *</Label>
            <Input name="email" type="email" placeholder={t('common.placeholders.email')} required />
          </div>
          <div className="space-y-1">
            <Label>{t('common.labels.password')} *</Label>
            <Input name="password" type="password" placeholder={t('common.placeholders.passwordInvite')} required />
          </div>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            New users are created as employees for your current store.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('common.actions.cancel')}</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.actions.createUser')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
