/**
 * Netlify Function — POST /api/check-username
 * Routed by the `/api/*` redirect in netlify.toml.
 */
import { handleCheckUsername } from '../lib/handlers/checkLookup'

export default async function handler(request: Request): Promise<Response> {
  return handleCheckUsername(request)
}
