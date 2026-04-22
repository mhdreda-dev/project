import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { apiError } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestI18n } from '@/lib/i18n/request'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function GET() {
  // Allow the UI to probe whether uploads are configured
  return NextResponse.json({ configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN) })
}

export async function POST(req: NextRequest) {
  try {
    const { t } = getRequestI18n(req)
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error: t('imageUpload.unavailableDescription'),
          code: 'UPLOAD_NOT_CONFIGURED',
        },
        { status: 503 },
      )
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      console.warn('[upload] rejected: no file in form data')
      return apiError(t('imageUpload.noFileProvided'), 400)
    }

    const sizeMb = (file.size / 1024 / 1024).toFixed(2)
    console.log(`[upload] incoming: name="${file.name}" type="${file.type}" size=${sizeMb}MB`)

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn(`[upload] rejected: unsupported type "${file.type}" for "${file.name}"`)
      return apiError(t('imageUpload.unsupportedDescription', { type: file.type || 'unknown' }), 400)
    }

    if (file.size > MAX_SIZE) {
      console.warn(`[upload] rejected: file too large (${sizeMb}MB > 10MB) for "${file.name}"`)
      return apiError(t('imageUpload.fileTooLargeDescription', { size: sizeMb }), 400)
    }

    const ext = file.name.split('.').pop()
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ url: blob.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    const { t } = getRequestI18n(req)
    // Detect missing-token error from Vercel Blob and return a friendly code
    if (/No token found|BLOB_READ_WRITE_TOKEN/i.test(msg)) {
      return NextResponse.json(
        { error: t('imageUpload.unavailableDescription'), code: 'UPLOAD_NOT_CONFIGURED' },
        { status: 503 },
      )
    }
    return apiError(msg || t('imageUpload.uploadFailedTitle'))
  }
}
