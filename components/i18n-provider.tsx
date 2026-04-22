'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LOCALE_COOKIE, type Locale, getLocaleDirection, normalizeLocale } from '@/lib/i18n/config'
import { createTranslator } from '@/lib/i18n'

type TranslationValues = Record<string, string | number>

interface I18nContextValue {
  locale: Locale
  dir: 'ltr' | 'rtl'
  t: (key: string, values?: TranslationValues) => string
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
  window.localStorage.setItem(LOCALE_COOKIE, locale)
}

function applyDocumentLocale(locale: Locale) {
  const dir = getLocaleDirection(locale)
  document.documentElement.lang = locale
  document.documentElement.dir = dir
}

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(normalizeLocale(initialLocale))

  useEffect(() => {
    setLocaleState(normalizeLocale(initialLocale))
  }, [initialLocale])

  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const normalized = normalizeLocale(locale)
    const t = createTranslator(normalized)

    return {
      locale: normalized,
      dir: getLocaleDirection(normalized),
      t,
      setLocale: (nextLocale) => {
        const normalizedNext = normalizeLocale(nextLocale)
        setLocaleState(normalizedNext)
        persistLocale(normalizedNext)
        applyDocumentLocale(normalizedNext)
        router.refresh()
      },
    }
  }, [locale, router])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}
