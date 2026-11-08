import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deriveState, handleCheckEmail } from '../netlify/lib/handlers/checkEmail'
import { resetRateLimits } from '../netlify/lib/rateLimit'
import type { EmailCheckResponse, ProviderResult } from '@/types'

function post(body: unknown, init: { ip?: string } = {}): Request {
  return new Request('https://example.test/api/check-email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-nf-client-connection-ip': init.ip ?? '203.0.113.7',
      host: 'example.test',
    },
    body: JSON.stringify(body),
  })
}

function xonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status })
}

beforeEach(() => {
  resetRateLimits()
  delete process.env.ORELYS_API_KEY
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
    expect(deriveState(3, [ok('xposedornot'), failed('orelys')], 2)).toBe('breached')
  })
  it('is clean only when every provider answered', () => {
    expect(deriveState(0, [ok('xposedornot'), ok('orelys')], 2)).toBe('clean')
  })
  it('is incomplete when one provider stayed silent', () => {
    expect(deriveState(0, [ok('xposedornot'), failed('orelys')], 2)).toBe('incomplete')
  })
  it('is an error when nobody answered', () => {
    expect(deriveState(0, [failed('xposedornot'), failed('orelys')], 2)).toBe('error')
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
    expect(spy).not.toHaveBeenCalledWith(
      expect.stringContaining('xposedornot'),
      expect.anything(),
    )
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

  it('returns a merged, honest result and flags the unconfigured provider', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: RequestInfo | URL) => {
        if (String(url).includes('breach-analytics')) {
          return xonResponse({
            ExposedBreaches: {
              breaches_details: [
                { breach: 'Adobe', domain: 'adobe.com', xposed_date: '2013-10-04' },
              ],
            },
          })
        }
        return xonResponse({ status: 'success', breaches: [['Adobe']] })
      }),
    )

    const response = await handleCheckEmail(post({ email: 'User@Example.com', consent: true }))
    const body = (await response.json()) as EmailCheckResponse

    expect(response.status).toBe(200)
    // A confirmed breach outranks incomplete coverage (red beats yellow)…
    expect(body.state).toBe('breached')
    expect(body.totalBreaches).toBe(1)
    expect(body.breaches[0].name).toBe('Adobe')
    expect(body.respondingProviders).toBe(1)
    expect(body.totalProviders).toBe(2)

    // …but the silent provider is still reported, never hidden.
    const orelys = body.providers.find((p) => p.provider === 'orelys')
    expect(orelys?.status).toBe('not_configured')
    expect(orelys?.responded).toBe(false)
  })

  it('returns "incomplete", not "clean", on a no-match with a missing provider', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"Error":"Not found"}', { status: 404 })))

    const response = await handleCheckEmail(post({ email: 'user@example.com', consent: true }))
    const body = (await response.json()) as EmailCheckResponse

    expect(body.state).toBe('incomplete')
    expect(body.totalBreaches).toBe(0)
    expect(body.ok).toBe(true)
    expect(body.respondingProviders).toBe(1)
  })

  it('never returns "clean" when every provider is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('down', { status: 503 })),
    )

    const response = await handleCheckEmail(post({ email: 'user@example.com', consent: true }))
    const body = (await response.json()) as EmailCheckResponse

    expect(response.status).toBe(200)
    expect(body.state).toBe('error')
    expect(body.ok).toBe(false)
    expect(body.breaches).toEqual([])
  })

  it('marks results no-store so a personal lookup is never cached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => xonResponse({ breaches: [['X']] })))
    const response = await handleCheckEmail(post({ email: 'user@example.com', consent: true }))
    expect(response.headers.get('cache-control')).toContain('no-store')
  })

  it('rate-limits a burst of lookups from the same client', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => xonResponse({ breaches: [] })))

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
