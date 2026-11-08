/**
 * Netlify Function — POST /api/check-email
 * Routed by the `/api/*` redirect in netlify.toml.
 *
 * The business logic lives in `netlify/lib/handlers/checkEmail.ts` so the exact
 * same code path runs under `vite dev` and under Netlify.
 */
import { handleCheckEmail } from '../lib/handlers/checkEmail'

export default async function handler(request: Request): Promise<Response> {
  return handleCheckEmail(request)
}
