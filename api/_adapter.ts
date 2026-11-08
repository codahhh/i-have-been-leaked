/**
 * Node ⇄ Web adapter for the Vercel entry points.
 *
 * The application (handlers, providers, rate limits) is written once against
 * the Web `Request`/`Response` standard, which is what Netlify Functions v2 and
 * the Vite dev bridge speak. Vercel's `api/` directory hands the function a
 * Node `IncomingMessage`/`ServerResponse` pair instead, so these two helpers
 * translate in each direction — no business logic lives here.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

/** Our handlers reject anything above 4 KB; this is the hard read cap. */
const MAX_BODY_BYTES = 8192

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        // Stop buffering immediately; the handler's own limit rejects it.
        chunks.push(chunk.subarray(0, Math.max(0, MAX_BODY_BYTES - (size - chunk.length))))
        req.destroy()
        resolve(Buffer.concat(chunks).toString('utf8'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', () => reject(new Error('unreadable body')))
  })
}

export async function readWebRequest(req: IncomingMessage): Promise<Request> {
  const host =
    (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host ?? 'localhost'
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https'
  const url = new URL(req.url ?? '/', `${proto}://${host}`)

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) for (const item of value) headers.append(key, item)
    else headers.set(key, value)
  }

  const method = (req.method ?? 'GET').toUpperCase()
  const body = method === 'GET' || method === 'HEAD' ? '' : await readBody(req)

  return new Request(url, {
    method,
    headers,
    body: body.length > 0 ? body : undefined,
  })
}

export async function sendWebResponse(
  webResponse: Response,
  res: ServerResponse,
): Promise<void> {
  res.statusCode = webResponse.status
  webResponse.headers.forEach((value, key) => res.setHeader(key, value))
  res.end(Buffer.from(await webResponse.arrayBuffer()))
}
