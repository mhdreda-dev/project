import type { NextRequest } from 'next/server'
import { createTranslator } from '@/lib/i18n'
import { LOCALE_COOKIE, getLocaleDirection, normalizeLocale } from '@/lib/i18n/config'

type RequestWithCookies = Pick<NextRequest, 'cookies'>

export function getRequestLocale(req: RequestWithCookies) {
  return normalizeLocale(req.cookies.get(LOCALE_COOKIE)?.value)
}

export function getRequestI18n(req: RequestWithCookies) {
  const locale = getRequestLocale(req)

  return {
    locale,
    dir: getLocaleDirection(locale),
    t: createTranslator(locale),
  }
}
