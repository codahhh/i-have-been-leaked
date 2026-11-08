/**
 * Netlify Function — POST /api/check-phone
 * Routed by the `/api/*` redirect in netlify.toml.
 */
import { handleCheckPhone } from '../lib/handlers/checkLookup'

export default async function handler(request: Request): Promise<Response> {
  return handleCheckPhone(request)
}
