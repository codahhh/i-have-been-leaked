/** Vercel Function — GET /api/breach-stats */
import { handleBreachStats } from '../netlify/lib/handlers/breachStats'

export async function GET(request: Request): Promise<Response> {
  return handleBreachStats(request)
}
