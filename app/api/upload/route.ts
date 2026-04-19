import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { apiError } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function GET() {
  // Allow the UI to probe whether uploads are configured
  return NextResponse.json({ configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN) })
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            'Image upload is not configured. Set BLOB_READ_WRITE_TOKEN in your environment to enable uploads.',
          code: 'UPLOAD_NOT_CONFIGURED',
        },
        { status: 503 },
      )
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      console.warn('[upload] rejected: no file in form data')
      return apiError('No file provided', 400)
    }

    const sizeMb = (file.size / 1024 / 1024).toFixed(2)
    console.log(`[upload] incoming: name="${file.name}" type="${file.type}" size=${sizeMb}MB`)

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn(`[upload] rejected: unsupported type "${file.type}" for "${file.name}"`)
      return apiError(
        `Unsupported file type "${file.type || 'unknown'}". Allowed: JPG, PNG, WebP, GIF.`,
        400,
      )
    }

    if (file.size > MAX_SIZE) {
      console.warn(`[upload] rejected: file too large (${sizeMb}MB > 10MB) for "${file.name}"`)
      return apiError(`File too large (${sizeMb} MB). Maximum size is 10 MB.`, 400)
    }

    const ext = file.name.split('.').pop()
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ url: blob.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    // Detect missing-token error from Vercel Blob and return a friendly code
    if (/No token found|BLOB_READ_WRITE_TOKEN/i.test(msg)) {
      return NextResponse.json(
        { error: 'Image upload is not configured on this server.', code: 'UPLOAD_NOT_CONFIGURED' },
        { status: 503 },
      )
    }
    return apiError(msg)
  }
}
