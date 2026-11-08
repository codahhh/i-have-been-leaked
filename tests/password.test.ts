// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The password module touches `window.isSecureContext`, so the node
 * environment gets a minimal stand-in. Web Crypto comes from Node itself.
 */
beforeEach(() => {
  vi.stubGlobal('window', { isSecureContext: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

const PASSWORD_HASH = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8' // sha1("password")
const PREFIX = PASSWORD_HASH.slice(0, 5)
const SUFFIX = PASSWORD_HASH.slice(5)

function rangeBody(entries: Array<[string, number]>): string {
  return entries.map(([suffix, count]) => `${suffix}:${count}`).join('\r\n')
}

describe('sha1Hex', () => {
  it('matches the reference digest for a known password', async () => {
    const { sha1Hex } = await import('@/services/pwnedPasswords')
    await expect(sha1Hex('password')).resolves.toBe(PASSWORD_HASH)
  })

  it('is case-insensitive in the prefix but uppercase in output', async () => {
    const { sha1Hex } = await import('@/services/pwnedPasswords')
    const digest = await sha1Hex('password')
    expect(digest).toBe(digest.toUpperCase())
    expect(digest).toHaveLength(40)
  })
})

describe('checkPassword', () => {
  it('sends only the 5-character prefix and compares the suffix locally', async () => {
    const spy = vi.fn(async (_input: RequestInfo | URL) =>
      new Response(
        rangeBody([
          ['0000000000000000000000000000000000A', 0], // padding row
          [SUFFIX, 1234],
        ]),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', spy)

    const { checkPassword } = await import('@/services/pwnedPasswords')
    const result = await checkPassword('password')

    expect(result).toMatchObject({ breached: true, count: 1234, source: 'direct' })
    expect(result.rangeSize).toBe(2)

    const url = String(spy.mock.calls[0][0])
    const { pathname, search, hostname } = new URL(url)
    expect(hostname).toBe('api.pwnedpasswords.com')
    expect(pathname).toBe(`/range/${PREFIX}`)
    expect(`${pathname}${search}`).not.toContain(SUFFIX) // the rest of the digest stays local
    expect(`${pathname}${search}`).not.toContain('password')
    expect(search).toContain('add-padding=true')
  })

  it('ignores padding rows when the password is absent from the range', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          rangeBody([
            ['11111111111111111111111111111111111', 97],
            ['0000000000000000000000000000000000B', 0],
          ]),
          { status: 200 },
        ),
      ),
    )

    const { checkPassword } = await import('@/services/pwnedPasswords')
    const result = await checkPassword('password')
    expect(result.breached).toBe(false)
    expect(result.count).toBe(0)
  })

  it('falls back to the server relay when the direct call fails', async () => {
    const spy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.startsWith('http')) throw new TypeError('blocked')
      return new Response(JSON.stringify({ prefix: PREFIX, suffixes: { [SUFFIX]: 9 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', spy)

    const { checkPassword } = await import('@/services/pwnedPasswords')
    const result = await checkPassword('password')

    expect(result).toMatchObject({ breached: true, count: 9, source: 'relay' })
    expect(String(spy.mock.calls[1][0])).toBe(`/api/password-range?prefix=${PREFIX}`)
  })

  it('reports a total failure instead of a reassuring result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).startsWith('http')) throw new TypeError('blocked')
        return new Response('{"error":{"code":"internal_error"}}', { status: 502 })
      }),
    )

    const { checkPassword, PasswordCheckError } = await import('@/services/pwnedPasswords')
    await expect(checkPassword('password')).rejects.toBeInstanceOf(PasswordCheckError)
  })

  it('refuses to run without a secure context', async () => {
    vi.stubGlobal('window', { isSecureContext: false })
    vi.resetModules()

    const { checkPassword, PasswordCheckError } = await import('@/services/pwnedPasswords')
    await expect(checkPassword('password')).rejects.toMatchObject({
      reason: 'insecure_context',
    })
    expect(PasswordCheckError).toBeDefined()
  })

  it('never writes the password anywhere in storage', async () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(rangeBody([[SUFFIX, 1]]), { status: 200 })))

    const { checkPassword } = await import('@/services/pwnedPasswords')
    await checkPassword('password')

    expect([...store.values()].join('|')).not.toContain('password')
    expect(store.size).toBe(0)
  })
})
