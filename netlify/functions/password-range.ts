/**
 * Netlify Function — GET /api/password-range?prefix=ABCDE
 * Fallback path for the HIBP range API. Receives a 5-char SHA-1 prefix only.
 */
import { handlePasswordRange } from '../lib/handlers/passwordRange'

export default async function handler(request: Request): Promise<Response> {
  return handlePasswordRange(request)
}
