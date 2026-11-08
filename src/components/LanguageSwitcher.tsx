import { Languages } from 'lucide-react'
import { LANGUAGES, useI18n, type Language } from '@/i18n'
import { cn } from '@/utils/cn'

const LABELS: Record<Language, string> = { fr: 'FR', en: 'EN' }

export function LanguageSwitcher() {
  const { lang, setLanguage, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5"
    >
      <Languages className="ml-1.5 h-3.5 w-3.5 text-faint" aria-hidden />

      {LANGUAGES.map((language) => {
        const active = language === lang
        return (
          <button
            key={language}
            type="button"
            onClick={() => setLanguage(language)}
            aria-pressed={active}
            title={t(language === 'fr' ? 'lang.fr' : 'lang.en')}
            className={cn(
              'h-7 rounded-[6px] px-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] transition-colors',
              active
                ? 'bg-rail text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                : 'text-faint hover:text-muted',
            )}
          >
            {LABELS[language]}
          </button>
        )
      })}
    </div>
  )
}
