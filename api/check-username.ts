/** Vercel Function — POST /api/check-username */
import { handleCheckUsername } from '../netlify/lib/handlers/checkLookup'

export async function POST(request: Request): Promise<Response> {
  return handleCheckUsername(request)
}
