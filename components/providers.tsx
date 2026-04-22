'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'
import { type Locale } from '@/lib/i18n/config'
import { I18nProvider } from '@/components/i18n-provider'

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: Locale
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
