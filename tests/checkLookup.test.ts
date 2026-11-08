import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deriveState,
  handleCheckEmail,
  handleCheckPhone,
  handleCheckUsername,
} from '../netlify/lib/handlers/checkLookup'
import { resetRateLimits } from '../netlify/lib/rateLimit'
import type { CheckResponse, ProviderResult } from '@/types'

function post(body: unknown, init: { ip?: string; path?: string } = {}): Request {
  return new Request(`https://example.test${init.path ?? '/api/check-email'}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-nf-client-connection-ip': init.ip ?? '203.0.113.7',
      host: 'example.test',
    },
    body: JSON.stringify(body),
  })
}

const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status })

/** Routes each provider host to a canned payload. */
function mockProviders(routes: {
  xposedornot?: () => Response
  leakcheck?: () => Response
}) {
  const spy = vi.fn(async (url: RequestInfo | URL) => {
    const target = String(url)
    if (target.includes('xposedornot')) {
      return (routes.xposedornot ?? (() => json({ Error: 'Not found' }, 404)))()
    }
    if (target.includes('leakcheck')) {
      return (routes.leakcheck ?? (() => json({ success: false, error: 'Not found' })))()
    }
    throw new Error(`unexpected outbound call: ${target}`)
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

beforeEach(() => {
  resetRateLimits()
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetRateLimits()
})

describe('deriveState', () => {
  const ok = (provider: ProviderResult['provider']): ProviderResult => ({
    provider,
    displayName: provider,
    status: 'ok',
    responded: true,
    breaches: [],
    exposedCategories: [],
    error: null,
    queriedAt: '2026-01-01T00:00:00.000Z',
    durationMs: 1,
  })
  const failed = (provider: ProviderResult['provider']): ProviderResult => ({
    ...ok(provider),
    status: 'unavailable',
    responded: false,
    error: { code: 'provider_error', detail: 'x', retryAfterSeconds: null },
  })

  it('is breached as soon as one breach exists', () => {
    expect(deriveState(3, [ok('xposedornot'), failed('leakcheck')], 2)).toBe('breached')
  })
  it('is clean only when every provider answered', () => {
    expect(deriveState(0, [ok('xposedornot'), ok('leakcheck')], 2)).toBe('clean')
  })
  it('is incomplete when one provider stayed silent', () => {
    expect(deriveState(0, [ok('xposedornot'), failed('leakcheck')], 2)).toBe('incomplete')
  })
  it('is an error when nobody answered', () => {
    expect(deriveState(0, [failed('xposedornot'), failed('leakcheck')], 2)).toBe('error')
  })
})

describe('POST /api/check-email', () => {
  it('rejects a malformed address without calling any provider', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)

    const response = await handleCheckEmail(post({ email: 'not-an-email', consent: true }))
    const body = (await response.json()) as { error: { code: string } }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('invalid_email')
    expect(spy).not.toHaveBeenCalled()
  })

  it('requires explicit consent before any transmission', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)

    const response = await handleCheckEmail(post({ email: 'user@example.com', consent: false }))
    const body = (await response.json()) as { error: { code: string } }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('consent_required')
    expect(spy).not.toHaveBeenCalled()
  })

  it('rejects non-POST methods and oversized bodies', async () => {
    const getResponse = await handleCheckEmail(
      new Request('https://example.test/api/check-email', { method: 'GET' }),
    )
    expect(getResponse.status).toBe(405)

    const huge = await handleCheckEmail(
      post({ email: 'user@example.com', consent: true, junk: 'x'.repeat(5000) }),
    )
    expect(huge.status).toBe(413)
  })

  it('blocks cross-origin browser calls', async () => {
    const request = new Request('https://example.test/api/check-email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://attacker.test',
        host: 'example.test',
      },
      body: JSON.stringify({ email: 'user@example.com', consent: true }),
    })
    const response = await handleCheckEmail(request)
    expect(response.status).toBe(403)
  })

  it('merges both providers and reports each one', async () => {
    mockProviders({
      xposedornot: () =>
        json({
          status: 'success',
          breaches: [['Adobe']],
          breach_details: [
            {
              name: 'Adobe',
              breach_date: '2013-10-04',
              company: { name: 'adobe.com' },
              exposed_data: ['Email addresses', 'Passwords'],
            },
          ],
        }),
      leakcheck: () =>
        json({
          success: true,
          found: 3,
          fields: ['email', 'password'],
          sources: [
            { name: 'Adobe.com', date: '2013-10' },
            { name: 'Dropbox.com', date: '2012-07' },
          ],
        }),
    })

    const response = await handleCheckEmail(post({ email: 'User@Example.com', consent: true }))
    const body = (await response.json()) as CheckResponse

    expect(response.status).toBe(200)
    expect(body.kind).toBe('email')
    expect(body.state).toBe('breached')
    // Adobe is reported by both providers and merged into a single record.
    expect(body.totalBreaches).toBe(2)
    const adobe = body.breaches.find((breach) => breach.name === 'Adobe')
    expect(adobe?.sources).toEqual(['xposedornot', 'leakcheck'])
    expect(body.respondingProviders).toBe(2)
    expect(body.totalProviders).toBe(2)

    // LeakCheck's aggregate categories stay on the provider, never on a breach.
    const leakcheck = body.providers.find((provider) => provider.provider === 'leakcheck')
    expect(leakcheck?.exposedCategories).toEqual(['email', 'password'])
    expect(leakcheck?.breaches[0].exposedData).toEqual([])
  })

  it('is clean only when every provider really answered "no match"', async () => {
    mockProviders({
      xposedornot: () => json({ Error: 'Not found' }, 404),
      leakcheck: () => json({ success: false, error: 'Not found' }),
    })

    const response = await handleCheckEmail(post({ email: 'user@example.com', consent: true }))
    const body = (await response.json()) as CheckResponse

    expect(body.state).toBe('clean')
    expect(body.totalBreaches).toBe(0)
    expect(body.respondingProviders).toBe(2)
    expect(body.ok).toBe(true)
  })

  it('returns "incomplete", not "clean", when one provider stayed silent', async () => {
    mockProviders({
      xposedornot: () => json({ Error: 'Not found' }, 404),
      leakcheck: () => new Response('down', { status: 503 }),
    })

    const response = await handleCheckEmail(post({ email: 'user@example.com', consent: true }))
    const body = (await response.json()) as CheckResponse

    expect(body.state).toBe('incomplete')
    expect(body.respondingProviders).toBe(1)
    expect(body.ok).toBe(true)
  })

  it('never returns "clean" when every provider is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('down', { status: 503 })),
    )

    const response = await handleCheckEmail(post({ email: 'user@example.com', consent: true }))
    const body = (await response.json()) as CheckResponse

    expect(response.status).toBe(200)
    expect(body.state).toBe('error')
    expect(body.ok).toBe(false)
    expect(body.breaches).toEqual([])
  })

  it('marks results no-store so a personal lookup is never cached', async () => {
    mockProviders({ xposedornot: () => json({ breaches: [['X']] }) })
    const response = await handleCheckEmail(post({ email: 'user@example.com', consent: true }))
    expect(response.headers.get('cache-control')).toContain('no-store')
  })

  it('rate-limits a burst of lookups from the same client', async () => {
    mockProviders({ xposedornot: () => json({ breaches: [] }) })

    const statuses: number[] = []
    for (let index = 0; index < 10; index += 1) {
      const response = await handleCheckEmail(
        post({ email: 'user@example.com', consent: true }, { ip: '198.51.100.9' }),
      )
      statuses.push(response.status)
    }

    expect(statuses.slice(0, 8).every((status) => status === 200)).toBe(true)
    expect(statuses.slice(8)).toEqual([429, 429])
  })

  it('never echoes the submitted address inside an error payload', async () => {
    const response = await handleCheckEmail(post({ email: 'user@example.com', consent: false }))
    const text = await response.text()
    expect(text).not.toContain('user@example.com')
  })
})

describe('POST /api/check-username', () => {
  it('queries only the providers that really support usernames', async () => {
    const spy = mockProviders({
      leakcheck: () =>
        json({ success: true, found: 1, fields: ['password'], sources: [{ name: 'Scam.com' }] }),
    })

    const response = await handleCheckUsername(
      post({ username: 'admin', consent: true }, { path: '/api/check-username' }),
    )
    const body = (await response.json()) as CheckResponse

    expect(response.status).toBe(200)
    expect(body.kind).toBe('username')
    expect(body.state).toBe('breached')
    expect(body.totalProviders).toBe(1)
    expect(body.breaches[0].name).toBe('Scam.com')

    // XposedOrNot has no username endpoint, so it is never called.
    expect(spy).toHaveBeenCalledTimes(1)
    expect(String(spy.mock.calls[0][0])).toContain('leakcheck')
  })

  it('rejects an invalid username without calling any provider', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)

    const response = await handleCheckUsername(
      post({ username: 'bad name!', consent: true }, { path: '/api/check-username' }),
    )
    const body = (await response.json()) as { error: { code: string } }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('invalid_username')
    expect(spy).not.toHaveBeenCalled()
  })

  it('still requires explicit consent', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)

    const response = await handleCheckUsername(
      post({ username: 'admin', consent: false }, { path: '/api/check-username' }),
    )
    const body = (await response.json()) as { error: { code: string } }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('consent_required')
    expect(spy).not.toHaveBeenCalled()
  })

  it('reports the single source as unanswered rather than clean', async () => {
    mockProviders({ leakcheck: () => new Response('down', { status: 503 }) })

    const response = await handleCheckUsername(
      post({ username: 'admin', consent: true }, { path: '/api/check-username' }),
    )
    const body = (await response.json()) as CheckResponse

    expect(body.state).toBe('error')
    expect(body.respondingProviders).toBe(0)
    expect(body.ok).toBe(false)
  })
})

describe('POST /api/check-phone', () => {
  it('sends bare E.164 digits with an explicit phone type', async () => {
    const spy = mockProviders({
      leakcheck: () =>
        json({
          success: true,
          found: 4,
          fields: ['phone', 'password', 'city'],
          sources: [
            { name: 'Boulanger.com', date: '2024-09' },
            { name: 'Cultura.com', date: '2024-09' },
          ],
        }),
    })

    const response = await handleCheckPhone(
      post({ phone: '+33 6 12 34 56 78', consent: true }, { path: '/api/check-phone' }),
    )
    const body = (await response.json()) as CheckResponse

    expect(response.status).toBe(200)
    expect(body.kind).toBe('phone')
    expect(body.state).toBe('breached')
    expect(body.totalBreaches).toBe(2)
    expect(body.providers).toHaveLength(1)

    const url = String(spy.mock.calls[0][0])
    // No `+`, no separators: the provider only types bare digits.
    expect(url).toContain('check=33612345678')
    expect(url).toContain('type=phone')
    expect(url).not.toContain('%2B')
  })

  it('rejects a number that cannot be E.164 without calling any provider', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)

    for (const phone of ['0612345678', '123', 'not-a-number', '+012345678']) {
      const response = await handleCheckPhone(
        post({ phone, consent: true }, { path: '/api/check-phone' }),
      )
      const body = (await response.json()) as { error: { code: string } }
      expect(response.status, phone).toBe(400)
      expect(body.error.code, phone).toBe('invalid_phone')
    }
    expect(spy).not.toHaveBeenCalled()
  })

  it('still requires explicit consent', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)

    const response = await handleCheckPhone(
      post({ phone: '+33612345678', consent: false }, { path: '/api/check-phone' }),
    )
    const body = (await response.json()) as { error: { code: string } }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('consent_required')
    expect(spy).not.toHaveBeenCalled()
  })

  it('never reports a failing single source as a clean number', async () => {
    mockProviders({ leakcheck: () => new Response('rate limited', { status: 429 }) })

    const response = await handleCheckPhone(
      post({ phone: '+33612345678', consent: true }, { path: '/api/check-phone' }),
    )
    const body = (await response.json()) as CheckResponse

    expect(body.state).toBe('error')
    expect(body.respondingProviders).toBe(0)
    expect(body.ok).toBe(false)
  })

  it('accepts a real "not found" as an answered query', async () => {
    mockProviders({ leakcheck: () => json({ success: false, error: 'Not found' }) })

    const response = await handleCheckPhone(
      post({ phone: '+33759812345', consent: true }, { path: '/api/check-phone' }),
    )
    const body = (await response.json()) as CheckResponse

    expect(body.state).toBe('clean')
    expect(body.respondingProviders).toBe(1)
    expect(body.totalBreaches).toBe(0)
  })
})
