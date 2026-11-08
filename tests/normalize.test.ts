import { describe, expect, it } from 'vitest'
import { cleanDate, cleanDomain, cleanName, slug, toBreach } from '../netlify/lib/normalize'
import { mergeBreaches } from '../netlify/lib/merge'
import type { ProviderResult } from '@/types'

function provider(overrides: Partial<ProviderResult> & { provider: ProviderResult['provider'] }): ProviderResult {
  return {
    displayName: overrides.provider,
    status: 'ok',
    responded: true,
    breaches: [],
    exposedCategories: [],
    error: null,
    queriedAt: '2026-01-01T00:00:00.000Z',
    durationMs: 10,
    ...overrides,
  }
}

describe('normalisation', () => {
  it('slugifies names deterministically', () => {
    expect(slug('Adobe Inc.')).toBe('adobe-inc')
    expect(slug('Ça Marche')).toBe('ca-marche')
  })

  it('cleans domains and rejects non-domains', () => {
    expect(cleanDomain('https://www.Example.com/path')).toBe('example.com')
    expect(cleanDomain('adobe.com')).toBe('adobe.com')
    expect(cleanDomain('not a domain')).toBeNull()
    expect(cleanDomain('javascript:alert(1)')).toBeNull()
    expect(cleanDomain(null)).toBeNull()
  })

  it('normalises dates and never invents one', () => {
    expect(cleanDate('2013-10-04')).toBe('2013-10-04')
    expect(cleanDate('2013-10')).toBe('2013-10')
    expect(cleanDate('2013')).toBe('2013')
    expect(cleanDate('2013-10-04T00:00:00Z')).toBe('2013-10-04')
    expect(cleanDate('October 2013')).toMatch(/^2013-10/)
    expect(cleanDate('yesterday')).toBeNull()
    expect(cleanDate('')).toBeNull()
  })

  it('truncates absurd names instead of trusting them', () => {
    expect(cleanName('a'.repeat(500)).length).toBeLessThanOrEqual(120)
  })

  it('builds a stable id from domain, falling back to the name', () => {
    const a = toBreach({ name: 'Adobe' }, 'xposedornot')
    const b = toBreach({ name: 'Adobe' }, 'leakcheck')
    expect(a.id).toBe(b.id)
    expect(a.id).toMatch(/^b_[a-z0-9-]+$/)

    const withDomain = toBreach({ name: 'Adobe Inc.', domain: 'adobe.com' }, 'xposedornot')
    expect(withDomain.id).toBe('b_adobe-com')
  })

  it('drops unknown pwn counts rather than showing zero', () => {
    expect(toBreach({ name: 'X', pwnCount: 0 }, 'leakcheck').pwnCount).toBeNull()
    expect(toBreach({ name: 'X', pwnCount: -5 }, 'leakcheck').pwnCount).toBeNull()
    expect(toBreach({ name: 'X', pwnCount: 152_445_165 }, 'leakcheck').pwnCount).toBe(152_445_165)
  })
})

describe('mergeBreaches', () => {
  it('merges the same breach reported by two providers into one record', () => {
    const xon = provider({
      provider: 'xposedornot',
      breaches: [
        toBreach(
          { name: 'Adobe', domain: 'adobe.com', breachDate: '2013', pwnCount: 152_445_165 },
          'xposedornot',
        ),
      ],
    })
    const leakcheck = provider({
      provider: 'leakcheck',
      breaches: [
        toBreach(
          {
            name: 'adobe', // different casing, no domain
            breachDate: '2013-10-04',
            exposedData: ['Emails', 'Passwords'],
            description: 'Creative Cloud leak',
          },
          'leakcheck',
        ),
      ],
    })

    const merged = mergeBreaches([xon, leakcheck])
    expect(merged).toHaveLength(1)
    expect(merged[0].sources).toEqual(['xposedornot', 'leakcheck'])
    expect(merged[0].breachDate).toBe('2013-10-04') // most precise date wins
    expect(merged[0].domain).toBe('adobe.com')
    expect(merged[0].exposedData).toEqual(['Emails', 'Passwords'])
    expect(merged[0].pwnCount).toBe(152_445_165)
    expect(merged[0].description).toBe('Creative Cloud leak')
  })

  it('keeps distinct breaches apart and sorts newest first', () => {
    const result = provider({
      provider: 'xposedornot',
      breaches: [
        toBreach({ name: 'Old One', breachDate: '2011-01-01' }, 'xposedornot'),
        toBreach({ name: 'Recent One', breachDate: '2023-05-05' }, 'xposedornot'),
        toBreach({ name: 'No Date' }, 'xposedornot'),
      ],
    })

    const merged = mergeBreaches([result])
    expect(merged.map((breach) => breach.name)).toEqual(['Recent One', 'Old One', 'No Date'])
  })

  it('de-duplicates within a single provider as well', () => {
    const result = provider({
      provider: 'leakcheck',
      breaches: [
        toBreach({ name: 'Dropbox' }, 'leakcheck'),
        toBreach({ name: 'Dropbox ' }, 'leakcheck'),
      ],
    })
    expect(mergeBreaches([result])).toHaveLength(1)
  })

  it('skips providers that returned nothing', () => {
    const empty = provider({ provider: 'leakcheck', status: 'unavailable', responded: false })
    expect(mergeBreaches([empty])).toEqual([])
  })
})
