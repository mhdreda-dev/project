import { cookies } from 'next/headers'
import { LOCALE_COOKIE, getLocaleDirection, normalizeLocale } from '@/lib/i18n/config'
import { createTranslator } from '@/lib/i18n'

export function getServerLocale() {
  const cookieStore = cookies()
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value)
}

export function getServerI18n() {
  const locale = getServerLocale()

  return {
    locale,
    dir: getLocaleDirection(locale),
    t: createTranslator(locale),
  }
}
