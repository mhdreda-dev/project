import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { apiError } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg']
const MAX_SIZE = 3 * 1024 * 1024

function getExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN) })
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return apiError('Forbidden', 403)

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Image upload is not configured.', code: 'UPLOAD_NOT_CONFIGURED' },
        { status: 503 },
      )
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return apiError('No file provided.', 400)

    const extension = getExtension(file.name)
    if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(extension)) {
      return apiError('Use a PNG, JPG, JPEG, WebP, or SVG logo.', 400)
    }

    if (file.size > MAX_SIZE) {
      return apiError('Logo must be 3 MB or smaller.', 400)
    }

    const filename = `brands/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ url: blob.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (/No token found|BLOB_READ_WRITE_TOKEN/i.test(msg)) {
      return NextResponse.json(
        { error: 'Image upload is not configured.', code: 'UPLOAD_NOT_CONFIGURED' },
        { status: 503 },
      )
    }
    return apiError(msg || 'Upload failed')
  }
}
