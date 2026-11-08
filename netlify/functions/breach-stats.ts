/**
 * Netlify Function — GET /api/breach-stats
 * Real aggregate figures pulled from the public XposedOrNot breach index.
 */
import { handleBreachStats } from '../lib/handlers/breachStats'

export default async function handler(request: Request): Promise<Response> {
  return handleBreachStats(request)
}
