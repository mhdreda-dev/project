import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/utils'

// In-memory store — for production use Redis (Upstash)
const requestMap = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

const DEFAULTS: RateLimitConfig = {
  limit: 60,
  windowMs: 60 * 1000,
}

const AUTH_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 15 * 60 * 1000,
}

function getRateLimitConfig(pathname: string): RateLimitConfig {
  if (pathname.startsWith('/api/auth')) return AUTH_LIMIT
  return DEFAULTS
}

export function rateLimit(req: NextRequest): NextResponse | null {
  const ip = getClientIp(req)
  const config = getRateLimitConfig(req.nextUrl.pathname)
  const key = `${ip}:${req.nextUrl.pathname}`
  const now = Date.now()

  const record = requestMap.get(key)

  if (!record || record.resetAt < now) {
    requestMap.set(key, { count: 1, resetAt: now + config.windowMs })
    return null
  }

  record.count++

  if (record.count > config.limit) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((record.resetAt - now) / 1000)),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(record.resetAt),
        },
      },
    )
  }

  return null
}

