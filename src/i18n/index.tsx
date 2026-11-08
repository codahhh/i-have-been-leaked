import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fr, type Dictionary, type TranslationKey } from './fr'
import { en } from './en'

export type Language = 'fr' | 'en'

export const LANGUAGES: Language[] = ['fr', 'en']

/**
 * Only the language preference is ever persisted. No search input, no result,
 * no identifier. This is the single storage key the app writes.
 */
export const LANGUAGE_STORAGE_KEY = 'ihl.language'

const DICTIONARIES: Record<Language, Dictionary> = { fr, en }

const LOCALES: Record<Language, string> = { fr: 'fr-FR', en: 'en-GB' }

export type TranslateVars = Record<string, string | number>

/**
 * Base keys that have `.one` / `.other` variants.
 * Listed explicitly: the type stays readable and the compiler checks each one.
 */
export type PluralKey =
  | 'results.state.breached.title'
  | 'results.list.count'
  | 'password.result.pwned.body'
  | 'rec.times'

export interface I18n {
  lang: Language
  locale: string
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, vars?: TranslateVars) => string
  tp: (key: PluralKey, count: number, vars?: TranslateVars) => string
  formatDate: (value: string | null | undefined) => string
  formatDateTime: (value: string | null | undefined) => string
  /** "8 Nov 2026, 10:22" — date and time together. */
  formatTimestamp: (value: string | null | undefined) => string
  /** "843 ms" / "1,28 s" using the active locale's decimal separator. */
  formatDuration: (ms: number) => string
  formatNumber: (value: number, options?: { compact?: boolean }) => string
}

const I18nContext = createContext<I18n | null>(null)

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value === undefined ? match : String(value)
  })
}

export function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'fr'
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'fr' || stored === 'en') return stored
  } catch {
    // Storage can be unavailable (private mode, hardened browsers).
  }
  // French is the product default. The selector is one click away and the
  // choice is remembered; we do not guess from the browser locale.
  return 'fr'
}

function persistLanguage(language: Language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Non-fatal: the preference simply will not survive a reload.
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => detectInitialLanguage())

  const setLanguage = useCallback((language: Language) => {
    setLang(language)
    persistLanguage(language)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<I18n>(() => {
    const dictionary = DICTIONARIES[lang]
    const fallback = DICTIONARIES.fr
    const locale = LOCALES[lang]

    const t = (key: TranslationKey, vars?: TranslateVars): string =>
      interpolate(dictionary[key] ?? fallback[key] ?? key, vars)

    const tp = (key: PluralKey, count: number, vars?: TranslateVars): string => {
      // French treats 0 and 1 as singular, English only 1.
      const singular = lang === 'fr' ? Math.abs(count) <= 1 : Math.abs(count) === 1
      const suffix = singular ? 'one' : 'other'
      const composed = `${key}.${suffix}` as TranslationKey
      return interpolate(dictionary[composed] ?? fallback[composed] ?? composed, {
        count,
        ...vars,
      })
    }

    const formatDate = (input: string | null | undefined): string => {
      if (!input) return ''
      const parts = input.split('-')
      try {
        if (parts.length === 1) return input
        if (parts.length === 2) {
          return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            timeZone: 'UTC',
          }).format(new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, 1)))
        }
        const date = new Date(`${input}T00:00:00Z`)
        if (Number.isNaN(date.getTime())) return input
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        }).format(date)
      } catch {
        return input
      }
    }

    const formatDateTime = (input: string | null | undefined): string => {
      if (!input) return ''
      const date = new Date(input)
      if (Number.isNaN(date.getTime())) return ''
      try {
        return new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(date)
      } catch {
        return date.toISOString().slice(11, 19)
      }
    }

    const formatTimestamp = (input: string | null | undefined): string => {
      if (!input) return ''
      const date = new Date(input)
      if (Number.isNaN(date.getTime())) return ''
      try {
        return new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date)
      } catch {
        return input
      }
    }

    const formatDuration = (ms: number): string => {
      if (!Number.isFinite(ms) || ms < 0) return '—'
      if (ms < 1000) return `${Math.round(ms)} ms`
      const seconds = ms / 1000
      const digits = seconds < 10 ? 2 : 1
      try {
        return `${new Intl.NumberFormat(locale, {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(seconds)} s`
      } catch {
        return `${seconds.toFixed(digits)} s`
      }
    }

    const formatNumber = (value: number, options?: { compact?: boolean }): string => {
      try {
        return new Intl.NumberFormat(locale, {
          notation: options?.compact ? 'compact' : 'standard',
          maximumFractionDigits: options?.compact ? 1 : 0,
        }).format(value)
      } catch {
        return String(value)
      }
    }

    return {
      lang,
      locale,
      setLanguage,
      t,
      tp,
      formatDate,
      formatDateTime,
      formatTimestamp,
      formatDuration,
      formatNumber,
    }
  }, [lang, setLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>')
  return context
}

/** Shorthand for the very common `const { t } = useI18n()`. */
export function useT() {
  return useI18n().t
}
