/**
 * Netlify Function — GET /api/providers
 * Provider capability matrix, backed by netlify/lib/config.ts.
 */
import { handleProviders } from '../lib/handlers/providers'

export default async function handler(request: Request): Promise<Response> {
  return handleProviders(request)
}
