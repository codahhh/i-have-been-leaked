import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js'

export interface CountryOption {
  code: CountryCode
  name: string
  dial: string
}

const cache = new Map<string, CountryOption[]>()

/**
 * Country list with localised names, generated at runtime with `Intl.DisplayNames`
 * (no 240-entry translation table to maintain, no extra bundle weight).
 */
export function getCountryOptions(locale: string): CountryOption[] {
  const cached = cache.get(locale)
  if (cached) return cached

  let display: Intl.DisplayNames | null = null
  try {
    display = new Intl.DisplayNames([locale], { type: 'region' })
  } catch {
    display = null
  }

  const options: CountryOption[] = getCountries().map((code) => ({
    code,
    name: display?.of(code) ?? code,
    dial: `+${getCountryCallingCode(code)}`,
  }))

  options.sort((a, b) => a.name.localeCompare(b.name, locale))
  cache.set(locale, options)
  return options
}

/** Best-effort default country from the browser locale (falls back to FR). */
export function guessDefaultCountry(preferred: string): CountryCode {
  const region = preferred.split('-')[1]?.toUpperCase()
  const countries = getCountries()
  if (region && (countries as string[]).includes(region)) return region as CountryCode
  return 'FR'
}

export type PhoneValidation =
  | { ok: true; e164: string; national: string; country: CountryCode }
  | { ok: false; reason: 'empty' | 'invalid' | 'unrecognized' }

export function validatePhoneNumber(input: string, country: CountryCode): PhoneValidation {
  const value = input.trim()
  if (value.length === 0) return { ok: false, reason: 'empty' }

  // Only dial characters are meaningful; reject letters early.
  if (!/^[+()\d\s.\-/]+$/.test(value)) return { ok: false, reason: 'unrecognized' }

  const parsed = parsePhoneNumberFromString(value, country)
  if (!parsed) {
    return { ok: false, reason: value.startsWith('+') ? 'unrecognized' : 'invalid' }
  }
  if (!parsed.isValid()) return { ok: false, reason: 'invalid' }

  return {
    ok: true,
    e164: parsed.number,
    national: parsed.formatNational(),
    country: parsed.country ?? country,
  }
}

/** Progressive national formatting while typing. */
export function formatAsYouType(input: string, country: CountryCode): string {
  return new AsYouType(country).input(input)
}
