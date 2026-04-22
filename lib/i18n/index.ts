import { DEFAULT_LOCALE, type Locale, normalizeLocale } from '@/lib/i18n/config'
import { translations } from '@/lib/i18n/translations'

type TranslationValues = Record<string, string | number>

export function translate(locale: Locale, key: string, values?: TranslationValues) {
  const message =
    translations[normalizeLocale(locale)][key] ??
    translations[DEFAULT_LOCALE][key] ??
    key

  if (!values) return message

  return message.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values[name] ?? ''))
}

export function createTranslator(locale: Locale) {
  return (key: string, values?: TranslationValues) => translate(locale, key, values)
}
