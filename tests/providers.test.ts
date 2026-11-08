import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryLeakCheck } from '../netlify/lib/providers/leakcheck'
import { queryXposedOrNot } from '../netlify/lib/providers/xposedOrNot'

type FetchHandler = (url: string, init: RequestInit) => Promise<Response> | Response

function mockFetch(handler: FetchHandler) {
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init ?? {}),
  )
  vi.stubGlobal('fetch', spy)
  return spy
}

const deadline = () => Date.now() + 5000

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('XposedOrNot provider', () => {
  /** Real payload shape, verified against the live API. */
  const detailedPayload = {
    status: 'success',
    email: 'user@example.com',
    breaches: [['Adobe', 'LinkedIn']],
    breach_details: [
      {
        name: 'Adobe',
        records_exposed: 152445165,
        description: 'Creative Cloud credentials.',
        breach_date: '2013-10-04',
        company: { name: 'adobe.com', industry: 'Software' },
        security: { password_risk: 'easytocrack' },
        exposed_data: ['Email addresses', 'Passwords', 'Usernames'],
      },
    ],
  }

  it('parses names and details from a single request', async () => {
    const spy = mockFetch(() => new Response(JSON.stringify(detailedPayload), { status: 200 }))

    const result = await queryXposedOrNot('user@example.com', deadline())

    expect(result.status).toBe('ok')
    expect(result.responded).toBe(true)
    expect(result.breaches.map((b) => b.name)).toEqual(['Adobe', 'LinkedIn'])
    expect(result.breaches[0].breachDate).toBe('2013-10-04')
    expect(result.breaches[0].domain).toBe('adobe.com')
    expect(result.breaches[0].exposedData).toEqual([
      'Email addresses',
      'Passwords',
      'Usernames',
      'Password risk: easytocrack',
    ])
    expect(result.breaches[0].pwnCount).toBe(152445165)
    // LinkedIn had no detail record: it still exists, just with empty fields.
    expect(result.breaches[1].breachDate).toBeNull()

    // Quota discipline: details come from the same call, not a second one.
    expect(spy).toHaveBeenCalledTimes(1)
    expect(String(spy.mock.calls[0][0])).toContain('details=true')
  })

  it('treats the documented 404 as a real "no match" answer', async () => {
    mockFetch(() => new Response(JSON.stringify({ Error: 'Not found' }), { status: 404 }))
    const result = await queryXposedOrNot('nobody@example.com', deadline())
    expect(result.status).toBe('not_found')
    expect(result.responded).toBe(true)
    expect(result.breaches).toEqual([])
  })

  it('accepts an explicit "Not found" body served with HTTP 200', async () => {
    mockFetch(() => new Response(JSON.stringify({ Error: 'Not found', email: null }), { status: 200 }))
    const result = await queryXposedOrNot('nobody@example.com', deadline())
    expect(result.status).toBe('not_found')
    expect(result.responded).toBe(true)
  })

  it('never reads a provider error body as a clean answer', async () => {
    mockFetch(() => new Response(JSON.stringify({ Error: 'Database unavailable' }), { status: 200 }))
    const result = await queryXposedOrNot('user@example.com', deadline())
    expect(result.status).toBe('unavailable')
    expect(result.responded).toBe(false)
    expect(result.error?.detail).toContain('Database unavailable')
  })

  it('reports HTTP 429 as rate-limited with the provider delay', async () => {
    mockFetch(() => new Response('', { status: 429, headers: { 'retry-after': '42' } }))
    const result = await queryXposedOrNot('user@example.com', deadline())
    expect(result.status).toBe('rate_limited')
    expect(result.responded).toBe(false)
    expect(result.error?.retryAfterSeconds).toBe(42)
  })

  it('reports a 5xx as unavailable, never as clean', async () => {
    mockFetch(() => new Response('boom', { status: 503 }))
    const result = await queryXposedOrNot('user@example.com', deadline())
    expect(result.status).toBe('unavailable')
    expect(result.responded).toBe(false)
    expect(result.error?.detail).toContain('503')
  })

  it('rejects an unparseable body instead of assuming no breach', async () => {
    mockFetch(() => new Response('<html>gateway</html>', { status: 200 }))
    const result = await queryXposedOrNot('user@example.com', deadline())
    expect(result.status).toBe('invalid_response')
    expect(result.responded).toBe(false)
  })

  it('maps network failures to unavailable', async () => {
    mockFetch(() => Promise.reject(new TypeError('fetch failed')))
    const result = await queryXposedOrNot('user@example.com', deadline())
    expect(result.status).toBe('unavailable')
    expect(result.error?.code).toBe('network_error')
  })

  it('aborts on the deadline and reports a timeout', async () => {
    mockFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          )
        }),
    )
    const result = await queryXposedOrNot('user@example.com', Date.now() + 30)
    expect(result.status).toBe('timeout')
    expect(result.responded).toBe(false)
  })

  it('still answers when the payload carries no detail array', async () => {
    mockFetch(() => new Response(JSON.stringify({ breaches: [['Dropbox']] }), { status: 200 }))
    const result = await queryXposedOrNot('user@example.com', deadline())
    expect(result.status).toBe('ok')
    expect(result.breaches).toHaveLength(1)
    expect(result.breaches[0].breachDate).toBeNull()
  })
})

describe('LeakCheck provider (public API)', () => {
  it('parses sources and aggregate categories, with no key required', async () => {
    const spy = mockFetch(
      () =>
        new Response(
          JSON.stringify({
            success: true,
            found: 1675,
            fields: ['password', 'ssn', 'dob', 'city'],
            sources: [
              { name: 'Aura.com', date: '2026-03' },
              { name: 'Canva.com', date: '2019-05' },
            ],
          }),
          { status: 200 },
        ),
    )

    const result = await queryLeakCheck('user@example.com', 'email', deadline())

    expect(result.status).toBe('ok')
    expect(result.responded).toBe(true)
    expect(result.breaches.map((b) => b.name)).toEqual(['Aura.com', 'Canva.com'])
    expect(result.breaches[0].breachDate).toBe('2026-03')
    expect(result.breaches[0].domain).toBe('aura.com')
    // Categories are query-level: attached to the provider, not to a source.
    expect(result.exposedCategories).toEqual(['password', 'ssn', 'dob', 'city'])
    expect(result.breaches[0].exposedData).toEqual([])

    // No credential is ever sent: the endpoint is public.
    const [url, init] = spy.mock.calls[0]
    expect(String(url)).toContain('leakcheck.io/api/public?check=user%40example.com')
    expect(init?.headers).not.toHaveProperty('Authorization')
  })

  it('supports username lookups on the same endpoint', async () => {
    const spy = mockFetch(
      () =>
        new Response(
          JSON.stringify({
            success: true,
            found: 1000,
            fields: ['city', 'password'],
            sources: [{ name: 'Scam.com', date: '2015-11' }],
          }),
          { status: 200 },
        ),
    )

    const result = await queryLeakCheck('admin', 'username', deadline())
    expect(result.status).toBe('ok')
    expect(result.breaches[0].name).toBe('Scam.com')
    expect(String(spy.mock.calls[0][0])).toContain('check=admin')
  })

  it('treats "Not found" as a real answer', async () => {
    mockFetch(
      () => new Response(JSON.stringify({ success: false, error: 'Not found' }), { status: 200 }),
    )
    const result = await queryLeakCheck('nobody@example.com', 'email', deadline())
    expect(result.status).toBe('not_found')
    expect(result.responded).toBe(true)
  })

  it('rejects a value the provider cannot type (e.g. a phone number)', async () => {
    mockFetch(
      () =>
        new Response(
          JSON.stringify({ success: false, error: 'Could not determine search type automatically' }),
          { status: 200 },
        ),
    )
    const result = await queryLeakCheck('+33612345678', 'username', deadline())
    expect(result.status).toBe('unavailable')
    expect(result.responded).toBe(false)
  })

  it('refuses to read matches it cannot name as "no match"', async () => {
    mockFetch(
      () => new Response(JSON.stringify({ success: true, found: 12, sources: [] }), { status: 200 }),
    )
    const result = await queryLeakCheck('user@example.com', 'email', deadline())
    expect(result.status).toBe('invalid_response')
    expect(result.responded).toBe(false)
  })

  it('rejects an unknown envelope instead of assuming no breach', async () => {
    mockFetch(() => new Response(JSON.stringify({ message: 'ok' }), { status: 200 }))
    const result = await queryLeakCheck('user@example.com', 'email', deadline())
    expect(result.status).toBe('invalid_response')
    expect(result.responded).toBe(false)
  })

  it('propagates rate limiting', async () => {
    mockFetch(() => new Response('', { status: 429, headers: { 'retry-after': '30' } }))
    const result = await queryLeakCheck('user@example.com', 'email', deadline())
    expect(result.status).toBe('rate_limited')
    expect(result.error?.retryAfterSeconds).toBe(30)
  })
})
