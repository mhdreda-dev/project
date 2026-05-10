'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2, Package, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { useI18n } from '@/components/i18n-provider'

type LoginClientProps = {
  storeSlug?: string
}

function storeInitials(name: string | null, slug: string) {
  const source = name || slug
  return source
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function LoginClient({ storeSlug = '' }: LoginClientProps) {
  const router = useRouter()
  const normalizedStoreSlug = storeSlug.trim().toLowerCase()
  const isStoreLogin = Boolean(normalizedStoreSlug)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [storeName, setStoreName] = useState<string | null>(null)
  const [storeError, setStoreError] = useState<string | null>(null)
  const [resolvingStore, setResolvingStore] = useState(false)
  const { t } = useI18n()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    let cancelled = false

    async function resolveStore() {
      setStoreName(null)
      setStoreError(null)

      if (!normalizedStoreSlug) return

      setResolvingStore(true)
      try {
        const res = await fetch(`/api/tenant/resolve?store=${encodeURIComponent(normalizedStoreSlug)}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setStoreError(json.error || 'Store not found or inactive')
          return
        }
        setStoreName(json.data?.store?.name ?? null)
      } catch {
        if (!cancelled) setStoreError('Unable to resolve store')
      } finally {
        if (!cancelled) setResolvingStore(false)
      }
    }

    resolveStore()
    return () => {
      cancelled = true
    }
  }, [normalizedStoreSlug])

  async function onSubmit(data: LoginInput) {
    if (storeError) {
      toast({ title: 'Invalid store', description: storeError, variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        storeSlug: normalizedStoreSlug,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: t('auth.login.failedTitle'),
          description: isStoreLogin
            ? 'Check your credentials and store access.'
            : 'Platform owner login is available only for SUPER_ADMIN accounts.',
          variant: 'destructive',
        })
        return
      }

      router.push('/dashboard')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const title = isStoreLogin ? storeName || normalizedStoreSlug : 'StockMaster'
  const description = isStoreLogin
    ? resolvingStore
      ? 'Resolving store...'
      : storeName
        ? 'Store sign in'
        : storeError ?? 'Store sign in'
    : 'Platform owner sign in'

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_46%,#f6fff8_100%)] px-4 py-6 sm:p-8">
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/80 to-transparent" />

      <Card className="relative w-full max-w-[92vw] overflow-hidden rounded-2xl border-white/70 bg-white/85 px-5 py-7 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:max-w-lg sm:px-8 sm:py-9 md:px-10 md:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />

        <CardHeader className="space-y-3 p-0 text-center sm:space-y-4">
          <div className="flex justify-center">
            {isStoreLogin ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-950/5 sm:h-16 sm:w-16">
                {storeName ? (
                  <span className="text-lg font-bold text-blue-700 sm:text-xl">
                    {storeInitials(storeName, normalizedStoreSlug)}
                  </span>
                ) : (
                  <Building2 className="h-7 w-7 text-blue-700 sm:h-8 sm:w-8" />
                )}
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 shadow-lg shadow-slate-950/20 sm:h-14 sm:w-14">
                <Package className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
            )}
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                <Sparkles className="h-3 w-3 text-blue-600" />
                StockMaster
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {title}
            </CardTitle>
            <CardDescription className="mx-auto max-w-sm text-sm leading-6 text-slate-500">
              {description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="mt-6 p-0 sm:mt-7">
          {storeError && (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive sm:mb-4">
              {storeError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">{t('common.labels.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('common.placeholders.loginEmail')}
                autoComplete="email"
                className="h-11 rounded-xl border-slate-200 bg-white/90 px-4 text-slate-950 shadow-sm focus-visible:ring-blue-500 sm:h-12"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">{t('common.labels.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('common.placeholders.password')}
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-slate-200 bg-white/90 px-4 pr-11 text-slate-950 shadow-sm focus-visible:ring-blue-500 sm:h-12"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-900 sm:h-12"
              disabled={isLoading || resolvingStore || Boolean(storeError)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.login.submitting')}
                </>
              ) : (
                t('auth.login.submit')
              )}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-left text-xs leading-5 text-slate-500 sm:mt-6">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>Access is invite-only. Ask your store administrator for an account.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
