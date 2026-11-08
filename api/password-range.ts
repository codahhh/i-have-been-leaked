/**
 * Vercel Function — GET /api/password-range?prefix=ABCDE
 *
 * Vercel's `api/` directory calls functions with a Node `(req, res)` pair, so
 * this thin entry translates to the Web `Request` the shared handler expects
 * and back. Everything below this line is identical to the Netlify entry: the
 * same handler, the same providers, the same rate limits.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handlePasswordRange } from '../netlify/lib/handlers/passwordRange'
import { readWebRequest, sendWebResponse } from './_adapter'

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const request = await readWebRequest(req)
  const response = await handlePasswordRange(request)
  await sendWebResponse(response, res)
}
