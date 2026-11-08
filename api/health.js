/**
 * Temporary diagnostic: no imports, no business logic.
 *
 * Lets us tell "the Vercel function runtime is broken" apart from "the shared
 * TypeScript module graph cannot be resolved from api/". Removed once the
 * production functions are verified.
 */
export default function handler(_req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ ok: true, node: process.version }))
}
