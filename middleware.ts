import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse } from 'next/server'

// Use the Edge-safe auth config — never import lib/auth.ts here (it pulls in
// Prisma + bcrypt which are Node.js-only and crash the Edge Runtime).
const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/tenant/resolve', '/api/ai/sales-agent', '/api/whatsapp/webhook']
const ADMIN_ONLY_PATHS = [
  '/admin',
  '/reports',
  '/api/reports',
  '/api/users',
  '/api/logs',
  '/api/products/stats',
  '/api/products/export',
  '/api/stock/export',
  '/api/stock/low/export',
]
const SUPER_ADMIN_ONLY_PATHS = ['/stores', '/api/stores']

function getHostname(req: Parameters<Parameters<typeof auth>[0]>[0]) {
  return (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').split(':')[0].toLowerCase()
}

function isPreviewHostname(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.vercel.app')
  )
}

function getConfiguredMainHost() {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? process.env.NEXTAUTH_URL
  if (!raw) return null
  try {
    return new URL(raw).hostname.toLowerCase()
  } catch {
    return raw.replace(/^https?:\/\//, '').split('/')[0]?.split(':')[0]?.toLowerCase() || null
  }
}

function getTenantSlugFromHost(hostname: string) {
  if (!hostname || isPreviewHostname(hostname)) return null

  const mainHost = getConfiguredMainHost()
  if (!mainHost || hostname === mainHost || !hostname.endsWith(`.${mainHost}`)) return null

  const slug = hostname.slice(0, -(mainHost.length + 1)).split('.').at(-1)
  return slug && /^[a-z0-9-]+$/.test(slug) ? slug : null
}

function loginUrl(reqUrl: string, tenantSlug: string | null) {
  const url = new URL('/login', reqUrl)
  if (tenantSlug) url.searchParams.set('store', tenantSlug)
  return url
}

export default auth(function middleware(req) {
  const { nextUrl } = req
  const session = req.auth
  const hostname = getHostname(req)
  const isPreview = isPreviewHostname(hostname)
  const tenantSlug = isPreview ? null : getTenantSlugFromHost(hostname)

  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p))

  if (!isPreview && tenantSlug && nextUrl.pathname === '/login' && !nextUrl.searchParams.get('store')) {
    return NextResponse.redirect(loginUrl(req.url, tenantSlug))
  }

  if (!isPublic && !session) {
    return NextResponse.redirect(loginUrl(req.url, tenantSlug))
  }

  if (isPublic && session && !nextUrl.pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const isAdminOnly = ADMIN_ONLY_PATHS.some((p) => nextUrl.pathname.startsWith(p))
  if (isAdminOnly && session?.user?.role !== 'ADMIN') {
    if (nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const isSuperAdminOnly = SUPER_ADMIN_ONLY_PATHS.some((p) => nextUrl.pathname.startsWith(p))
  if (isSuperAdminOnly && session?.user?.role !== 'SUPER_ADMIN') {
    if (nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)',
  ],
}
