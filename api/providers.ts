/** Vercel Function — GET /api/providers */
import { handleProviders } from '../netlify/lib/handlers/providers'

export async function GET(request: Request): Promise<Response> {
  return handleProviders(request)
}
