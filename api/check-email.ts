/**
 * Vercel Function — POST /api/check-email
 *
 * A Web-standard handler, exactly like the Netlify one: both entries call the
 * same orchestrator in `netlify/lib/handlers/checkLookup.ts`, so the provider
 * code, the rate limits and the invariants are identical on either host.
 */
import { handleCheckEmail } from '../netlify/lib/handlers/checkLookup'

export async function POST(request: Request): Promise<Response> {
  return handleCheckEmail(request)
}
