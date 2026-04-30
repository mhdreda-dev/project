import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/providers'
import { getServerI18n } from '@/lib/i18n/server'
import { ChatButton } from '@/components/ai/chat-button'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StockMaster — Inventory Management',
  description: 'Production-grade SaaS inventory management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, dir } = getServerI18n()

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers initialLocale={locale}>
          {children}
          <ChatButton />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
