/** Vercel Function — GET /api/password-range?prefix=ABCDE */
import { handlePasswordRange } from '../netlify/lib/handlers/passwordRange'

export async function GET(request: Request): Promise<Response> {
  return handlePasswordRange(request)
}
