/**
 * Cross-provider merging.
 *
 * Two providers rarely spell a breach the same way ("Adobe" vs "adobe.com"),
 * so records are matched on a normalised domain *or* name and then folded
 * into a single record that keeps the best available field from each source.
 */

import type { NormalizedBreach, ProviderResult } from '../../src/types/index'
import { slug } from './normalize'

function datePrecision(date: string | null): number {
  if (!date) return 0
  return date.split('-').length
}

function mergeInto(target: NormalizedBreach, incoming: NormalizedBreach): void {
  for (const source of incoming.sources) {
    if (!target.sources.includes(source)) target.sources.push(source)
  }
  if (!target.domain && incoming.domain) target.domain = incoming.domain
  if (datePrecision(incoming.breachDate) > datePrecision(target.breachDate)) {
    target.breachDate = incoming.breachDate
  }
  for (const item of incoming.exposedData) {
    if (!target.exposedData.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
      target.exposedData.push(item)
    }
  }
  if (
    incoming.description &&
    (!target.description || incoming.description.length > target.description.length)
  ) {
    target.description = incoming.description
  }
  if (incoming.pwnCount && (!target.pwnCount || incoming.pwnCount > target.pwnCount)) {
    target.pwnCount = incoming.pwnCount
  }
}

/**
 * Merges the breach lists of every provider result.
 * The returned array is sorted newest-first, then alphabetically.
 */
export function mergeBreaches(results: ProviderResult[]): NormalizedBreach[] {
  const byName = new Map<string, NormalizedBreach>()
  const byDomain = new Map<string, NormalizedBreach>()
  const merged: NormalizedBreach[] = []

  for (const result of results) {
    for (const breach of result.breaches) {
      const nameKey = slug(breach.name)
      const domainKey = breach.domain ? slug(breach.domain) : null

      const existing =
        (nameKey ? byName.get(nameKey) : undefined) ??
        (domainKey ? byDomain.get(domainKey) : undefined)

      if (existing) {
        mergeInto(existing, breach)
        if (nameKey) byName.set(nameKey, existing)
        if (domainKey) byDomain.set(domainKey, existing)
        continue
      }

      const copy: NormalizedBreach = {
        ...breach,
        sources: [...breach.sources],
        exposedData: [...breach.exposedData],
      }
      merged.push(copy)
      if (nameKey) byName.set(nameKey, copy)
      if (domainKey) byDomain.set(domainKey, copy)
    }
  }

  return merged.sort((a, b) => {
    const aDate = a.breachDate ?? ''
    const bDate = b.breachDate ?? ''
    if (aDate !== bDate) return bDate.localeCompare(aDate)
    return a.name.localeCompare(b.name)
  })
}
