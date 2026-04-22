export const LOCALE_COOKIE = 'stockmaster_locale'

export const SUPPORTED_LOCALES = ['en', 'fr', 'ar', 'darija'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as Locale))
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export function isRtlLocale(locale: Locale) {
  return locale === 'ar' || locale === 'darija'
}

export function getLocaleDirection(locale: Locale) {
  return isRtlLocale(locale) ? 'rtl' : 'ltr'
}
