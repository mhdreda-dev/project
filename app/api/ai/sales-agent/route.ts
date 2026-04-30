import { NextRequest } from 'next/server'
import { z } from 'zod'
import { answerSalesAgent } from '@/lib/ai/sales-agent'
import { saveSalesAgentEvent } from '@/lib/ai/lead-tracking'
import { sanitizeSalesMessage } from '@/lib/ai/product-search'
import { apiError, apiSuccess, getClientIp } from '@/lib/utils'

export const runtime = 'nodejs'

const bodySchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message is required')
    .max(500, 'Message must be 500 characters or less'),
})

const fallbackBuckets = globalThis as typeof globalThis & {
  stockMasterAiRateLimit?: Map<string, { count: number; resetAt: number }>
}

const WINDOW_MS = 10 * 60 * 1000
const LIMIT = 20

async function checkUpstashRateLimit(ip: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const key = `stockmaster:ai-sales-agent:${ip}:${Math.floor(Date.now() / WINDOW_MS)}`

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, Math.ceil(WINDOW_MS / 1000)],
      ]),
    })

    if (!response.ok) return null

    const data = (await response.json()) as Array<{ result?: number }>
    const count = Number(data[0]?.result ?? 0)

    return {
      allowed: count <= LIMIT,
      remaining: Math.max(0, LIMIT - count),
    }
  } catch {
    return null
  }
}

function checkMemoryRateLimit(ip: string) {
  const now = Date.now()
  const buckets = (fallbackBuckets.stockMasterAiRateLimit ??= new Map())
  const current = buckets.get(ip)

  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: LIMIT - 1 }
  }

  current.count += 1
  return {
    allowed: current.count <= LIMIT,
    remaining: Math.max(0, LIMIT - current.count),
  }
}

async function checkRateLimit(ip: string) {
  return (await checkUpstashRateLimit(ip)) ?? checkMemoryRateLimit(ip)
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rateLimit = await checkRateLimit(ip)
  if (!rateLimit.allowed) return apiError('Too many requests. Please try again later.', 429)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

  try {
    const message = sanitizeSalesMessage(parsed.data.message)
    if (!message) return apiError('Message is required', 400)

    const result = await answerSalesAgent(message)
    await saveSalesAgentEvent({
      message,
      answer: result.answer,
      tracking: result.tracking,
      ipAddress: ip,
      userAgent: req.headers.get('user-agent'),
      source: 'website',
    }).catch((error) => {
      console.error('Failed to save AI sales event', error)
    })

    return apiSuccess({
      answer: result.answer,
      products: result.products.map(({ id, ...product }) => product),
    })
  } catch {
    return apiError('Failed to answer message', 500)
  }
}
