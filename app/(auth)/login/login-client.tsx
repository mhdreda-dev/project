'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2, Package } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            {isStoreLogin ? (
              <div className="h-16 w-16 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-center">
                {storeName ? (
                  <span className="text-xl font-bold text-blue-700">
                    {storeInitials(storeName, normalizedStoreSlug)}
                  </span>
                ) : (
                  <Building2 className="h-8 w-8 text-blue-700" />
                )}
              </div>
            ) : (
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Package className="h-7 w-7 text-white" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            {isStoreLogin && <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">StockMaster</p>}
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {storeError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {storeError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">{t('common.labels.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('common.placeholders.loginEmail')}
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">{t('common.labels.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('common.placeholders.password')}
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || resolvingStore || Boolean(storeError)}>
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

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Access is invite-only. Ask your store administrator for an account.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
