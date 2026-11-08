/**
 * Normalisation helpers: every provider payload is squeezed into the same
 * breach shape before it ever reaches the client.
 */

import type { NormalizedBreach, ProviderId } from '../../src/types/index'
import { uniqueStrings } from './http'

const MAX_NAME_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 900

export function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function cleanName(raw: string): string {
  const trimmed = raw.replace(/\s+/g, ' ').trim()
  return trimmed.length > MAX_NAME_LENGTH ? `${trimmed.slice(0, MAX_NAME_LENGTH - 1)}…` : trimmed
}

export function cleanDomain(raw: string | null): string | null {
  if (!raw) return null
  let candidate = raw.trim().toLowerCase()
  candidate = candidate.replace(/^https?:\/\//, '').replace(/^www\./, '')
  candidate = candidate.split('/')[0].split('?')[0]
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(candidate)) return null
  return candidate.slice(0, 120)
}

export function cleanDate(raw: string | null): string | null {
  if (!raw) return null
  const value = raw.trim()
  // ISO date / month / year, or `DD/MM/YYYY` and similar common variants.
  const iso = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/)
  if (iso) {
    const [, year, month, day] = iso
    if (Number(month) >= 1 && Number(month) <= 12) {
      return day ? `${year}-${month}-${day}` : `${year}-${month}`
    }
  }
  const yearOnly = value.match(/^(\d{4})$/)
  if (yearOnly) return yearOnly[1]

  const parsed = Date.parse(value)
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed)
    const year = date.getUTCFullYear()
    if (year > 1990 && year <= new Date().getUTCFullYear() + 1) {
      return date.toISOString().slice(0, 10)
    }
  }
  return null
}

export function cleanExposedData(values: string[]): string[] {
  return uniqueStrings(
    values
      .map((value) => value.replace(/\s+/g, ' ').trim())
      .filter((value) => value.length > 0 && value.length <= 60),
  ).slice(0, 24)
}

export function cleanDescription(raw: string | null): string | null {
  if (!raw) return null
  const collapsed = raw.replace(/\s+/g, ' ').trim()
  if (collapsed.length === 0) return null
  return collapsed.length > MAX_DESCRIPTION_LENGTH
    ? `${collapsed.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…`
    : collapsed
}

/**
 * Builds a stable identifier for de-duplication.
 *
 * The id is derived from the breach name/domain only — it is not reversible
 * and carries nothing about the person who triggered the lookup.
 */
export function breachId(name: string, domain: string | null): string {
  return `b_${slug(domain ?? name)}`
}

export interface BreachDraft {
  name: string
  domain?: string | null
  breachDate?: string | null
  exposedData?: string[]
  description?: string | null
  pwnCount?: number | null
}

export function toBreach(draft: BreachDraft, source: ProviderId | string): NormalizedBreach {
  const name = cleanName(draft.name)
  const domain = cleanDomain(draft.domain ?? null)
  return {
    id: breachId(name, domain),
    name,
    domain,
    breachDate: cleanDate(draft.breachDate ?? null),
    exposedData: cleanExposedData(draft.exposedData ?? []),
    source,
    sources: [source],
    description: cleanDescription(draft.description ?? null),
    pwnCount:
      typeof draft.pwnCount === 'number' && Number.isFinite(draft.pwnCount) && draft.pwnCount > 0
        ? Math.round(draft.pwnCount)
        : null,
  }
}
