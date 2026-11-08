/**
 * Netlify Function — POST /api/check-email
 * Routed by the `/api/*` redirect in netlify.toml.
 *
 * The business logic lives in `netlify/lib/handlers/checkLookup.ts` so the exact
 * same code path runs under `vite dev`, Netlify and Vercel.
 */
import { handleCheckEmail } from '../lib/handlers/checkLookup'

export default async function handler(request: Request): Promise<Response> {
  return handleCheckEmail(request)
}
