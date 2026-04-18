import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { apiError } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return apiError('Unauthorized', 401)

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return apiError('No file provided', 400)

    if (!ALLOWED_TYPES.includes(file.type))
      return apiError('Invalid file type. Allowed: jpg, png, webp', 400)

    if (file.size > MAX_SIZE)
      return apiError('File too large. Maximum size: 5 MB', 400)

    const ext = file.name.split('.').pop()
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(filename, file, { access: 'public' })

    return NextResponse.json({ url: blob.url })
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Upload failed')
  }
}
