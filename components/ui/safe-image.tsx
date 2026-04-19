'use client'

import { useEffect, useState } from 'react'
import Image, { ImageProps } from 'next/image'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

type SafeImageProps = Omit<ImageProps, 'src' | 'onError'> & {
  src?: string | null
  fallbackClassName?: string
}

/**
 * Renders a next/image with graceful fallback:
 *  - If src is empty/null → shows Package icon placeholder.
 *  - If src fails to load (404, CORS, blocked host) → swaps to the same placeholder.
 *  - Blob URLs (preview from the upload component) are rendered unoptimized.
 *  - Unknown hosts not whitelisted in next.config images.remotePatterns fall back to <img>
 *    with unoptimized so they still render instead of breaking the optimizer.
 */
export function SafeImage({ src, alt, className, fallbackClassName, ...rest }: SafeImageProps) {
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setErrored(false)
  }, [src])

  const valid = typeof src === 'string' && src.length > 0

  if (!valid || errored) {
    return (
      <div
        className={cn(
          'w-full h-full flex items-center justify-center bg-slate-50',
          fallbackClassName,
        )}
      >
        <Package className="h-10 w-10 text-slate-200" />
      </div>
    )
  }

  const isBlobPreview = src!.startsWith('blob:') || src!.startsWith('data:')

  return (
    <Image
      src={src!}
      alt={alt}
      className={className}
      unoptimized={isBlobPreview}
      onError={() => setErrored(true)}
      {...rest}
    />
  )
}
