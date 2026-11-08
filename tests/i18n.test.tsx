import { describe, expect, it, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { fr } from '@/i18n/fr'
import { en } from '@/i18n/en'
import { I18nProvider, LANGUAGE_STORAGE_KEY, useI18n } from '@/i18n'

const frKeys = Object.keys(fr).sort()
const enKeys = Object.keys(en).sort()

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
}

describe('translation dictionaries', () => {
  it('define exactly the same keys', () => {
    expect(enKeys).toEqual(frKeys)
  })

  it('have no empty values', () => {
    for (const key of frKeys) {
      expect(String(fr[key as keyof typeof fr]).trim(), `fr:${key}`).not.toBe('')
      expect(String(en[key as keyof typeof en]).trim(), `en:${key}`).not.toBe('')
    }
  })

  it('use the same interpolation placeholders in both languages', () => {
    for (const key of frKeys) {
      const inFr = placeholders(String(fr[key as keyof typeof fr]))
      const inEn = placeholders(String(en[key as keyof typeof en]))
      expect(inEn, `placeholders differ for ${key}`).toEqual(inFr)
    }
  })

  it('provide both plural forms for every pluralised base key', () => {
    for (const key of frKeys) {
      if (!key.endsWith('.one')) continue
      const base = key.slice(0, -4)
      expect(frKeys, `fr missing ${base}.other`).toContain(`${base}.other`)
      expect(enKeys, `en missing ${base}.other`).toContain(`${base}.other`)
    }
  })
})

describe('i18n provider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider>{children}</I18nProvider>

  it('defaults to French and interpolates variables', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })
    expect(result.current.lang).toBe('fr')
    expect(result.current.t('results.for', { email: 'a@b.co' })).toContain('a@b.co')
    expect(result.current.t('brand.name')).toBe('i have been leaked')
  })

  it('switches language and persists only the locale', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })

    act(() => result.current.setLanguage('en'))
    expect(result.current.lang).toBe('en')
    expect(result.current.t('nav.password')).toBe('Password')

    expect(window.localStorage.length).toBe(1)
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })

  it('applies French plural rules to zero', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })
    // French: 0 and 1 are singular.
    expect(result.current.tp('results.list.count', 0)).toBe('0 fuite')
    expect(result.current.tp('results.list.count', 1)).toBe('1 fuite')
    expect(result.current.tp('results.list.count', 2)).toBe('2 fuites')
  })

  it('applies English plural rules to zero', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })
    act(() => result.current.setLanguage('en'))
    expect(result.current.tp('results.list.count', 0)).toBe('0 breaches')
    expect(result.current.tp('results.list.count', 1)).toBe('1 breach')
  })

  it('formats partial dates without inventing a day', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })
    act(() => result.current.setLanguage('en'))
    expect(result.current.formatDate('2013')).toBe('2013')
    expect(result.current.formatDate('2013-10')).toBe('October 2013')
    expect(result.current.formatDate('2013-10-04')).toBe('4 Oct 2013')
  })
})
