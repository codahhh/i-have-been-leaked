import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryXposedOrNot } from '../netlify/lib/providers/xposedOrNot'
import { queryOrelys } from '../netlify/lib/providers/orelys'

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
  delete process.env.ORELYS_API_KEY
})

describe('XposedOrNot provider', () => {
  it('parses breach names and enriches them with dates and data classes', async () => {
    mockFetch((url) => {
      if (url.includes('/v1/breach-analytics')) {
        return new Response(
          JSON.stringify({
            ExposedBreaches: {
              breaches_details: [
                {
                  breach: 'Adobe',
                  domain: 'adobe.com',
                  xposed_date: '2013-10-04',
                  xposed_data: 'Emails;Passwords;Usernames',
                  details: 'Creative Cloud credentials.',
                  xposed_records: 152445165,
                },
              ],
            },
          }),
          { status: 200 },
        )
      }
      return new Response(
        JSON.stringify({ status: 'success', breaches: [['Adobe', 'LinkedIn']] }),
        { status: 200 },
      )
    })

    const result = await queryXposedOrNot('user@example.com', deadline())

    expect(result.status).toBe('ok')
    expect(result.responded).toBe(true)
    expect(result.breaches.map((b) => b.name)).toEqual(['Adobe', 'LinkedIn'])
    expect(result.breaches[0].breachDate).toBe('2013-10-04')
    expect(result.breaches[0].domain).toBe('adobe.com')
    expect(result.breaches[0].exposedData).toEqual(['Emails', 'Passwords', 'Usernames'])
    expect(result.breaches[0].pwnCount).toBe(152445165)
    // LinkedIn had no detail: it still exists, just with empty fields.
    expect(result.breaches[1].breachDate).toBeNull()
  })

  it('treats the documented 404 as a real "no match" answer', async () => {
    mockFetch(() => new Response(JSON.stringify({ Error: 'Not found' }), { status: 404 }))
    const result = await queryXposedOrNot('nobody@example.com', deadline())
    expect(result.status).toBe('not_found')
    expect(result.responded).toBe(true)
    expect(result.breaches).toEqual([])
  })

  it('reports HTTP 429 as rate-limited with the provider delay', async () => {
    mockFetch(
      () => new Response('', { status: 429, headers: { 'retry-after': '42' } }),
    )
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

  it('keeps the primary result when enrichment fails', async () => {
    mockFetch((url) => {
      if (url.includes('/v1/breach-analytics')) return new Response('nope', { status: 500 })
      return new Response(JSON.stringify({ breaches: [['Dropbox']] }), { status: 200 })
    })
    const result = await queryXposedOrNot('user@example.com', deadline())
    expect(result.status).toBe('ok')
    expect(result.breaches).toHaveLength(1)
    expect(result.breaches[0].breachDate).toBeNull()
  })
})

describe('Orelys provider', () => {
  it('is reported as not configured when the API key is absent', async () => {
    const spy = mockFetch(() => new Response('{}', { status: 200 }))
    const result = await queryOrelys('user@example.com', deadline())
    expect(result.status).toBe('not_configured')
    expect(result.responded).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })

  it('parses a document-shaped payload when configured', async () => {
    process.env.ORELYS_API_KEY = 'test-key'
    const spy = mockFetch(
      () =>
        new Response(
          JSON.stringify({
            breaches: [
              {
                name: 'Canva',
                domain: 'canva.com',
                breachDate: '2019-05-24',
                dataClasses: ['Email addresses', 'Passwords'],
                pwnCount: 137000000,
              },
            ],
          }),
          { status: 200 },
        ),
    )

    const result = await queryOrelys('user@example.com', deadline())
    expect(result.status).toBe('ok')
    expect(result.breaches[0].name).toBe('Canva')
    expect(result.breaches[0].breachDate).toBe('2019-05-24')
    expect(result.breaches[0].exposedData).toEqual(['Email addresses', 'Passwords'])

    // The address goes in the JSON body, with a bearer token header.
    const [, init] = spy.mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'user@example.com' })
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer test-key')
  })

  it('accepts an explicit negative answer', async () => {
    process.env.ORELYS_API_KEY = 'test-key'
    mockFetch(() => new Response(JSON.stringify({ found: false }), { status: 200 }))
    const result = await queryOrelys('user@example.com', deadline())
    expect(result.status).toBe('not_found')
    expect(result.responded).toBe(true)
  })

  it('refuses to read an unknown payload as "no breach"', async () => {
    process.env.ORELYS_API_KEY = 'test-key'
    mockFetch(() => new Response(JSON.stringify({ message: 'ok', data: { foo: 1 } }), { status: 200 }))
    const result = await queryOrelys('user@example.com', deadline())
    expect(result.status).toBe('invalid_response')
    expect(result.responded).toBe(false)
  })

  it('surfaces rejected credentials as a configuration problem', async () => {
    process.env.ORELYS_API_KEY = 'wrong'
    mockFetch(() => new Response('unauthorized', { status: 401 }))
    const result = await queryOrelys('user@example.com', deadline())
    expect(result.status).toBe('not_configured')
    expect(result.error?.code).toBe('unauthorized')
  })

  it('propagates rate limiting', async () => {
    process.env.ORELYS_API_KEY = 'test-key'
    mockFetch(() => new Response('', { status: 429, headers: { 'retry-after': '30' } }))
    const result = await queryOrelys('user@example.com', deadline())
    expect(result.status).toBe('rate_limited')
    expect(result.error?.retryAfterSeconds).toBe(30)
  })
})
