import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse } from 'next/server'

// Use the Edge-safe auth config — never import lib/auth.ts here (it pulls in
// Prisma + bcrypt which are Node.js-only and crash the Edge Runtime).
const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/api/ai/sales-agent', '/api/whatsapp/webhook']
const ADMIN_ONLY_PATHS = ['/admin', '/api/users', '/api/logs']

export default auth(function middleware(req) {
  const { nextUrl } = req
  const session = req.auth

  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p))

  if (!isPublic && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
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
