/**
 * Vercel Function — GET /api/providers
 *
 * Vercel's `api/` directory calls functions with a Node `(req, res)` pair, so
 * this thin entry translates to the Web `Request` the shared handler expects
 * and back. Everything below this line is identical to the Netlify entry: the
 * same handler, the same providers, the same rate limits.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleProviders } from '../netlify/lib/handlers/providers'
import { readWebRequest, sendWebResponse } from './_adapter'

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const request = await readWebRequest(req)
  const response = await handleProviders(request)
  await sendWebResponse(response, res)
}
