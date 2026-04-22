'use client'

import { useI18n } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'

const LANGUAGE_OPTIONS = [
  { value: 'fr' as const, label: 'FR' },
  { value: 'ar' as const, label: 'AR' },
  { value: 'darija' as const, label: 'Darija' },
]

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className="shrink-0 inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const isActive = locale === option.value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => setLocale(option.value)}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors sm:px-3 sm:text-xs',
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
