import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http'

/**
 * Dev-only bridge for the Netlify Functions.
 *
 * The very same handler modules that Netlify bundles are loaded through Vite's
 * SSR pipeline, so `npm run dev` exercises the real provider code path
 * (timeouts, rate limits, merging) instead of a mock. In production the
 * `/api/*` redirect in netlify.toml points at the bundled functions.
 */
const API_ROUTES: Record<string, string> = {
  '/api/check-email': '/netlify/functions/check-email.ts',
  '/api/check-username': '/netlify/functions/check-username.ts',
  '/api/password-range': '/netlify/functions/password-range.ts',
  '/api/providers': '/netlify/functions/providers.ts',
  '/api/breach-stats': '/netlify/functions/breach-stats.ts',
}

function toHeaders(headers: IncomingHttpHeaders): Headers {
  const result = new Headers()
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) value.forEach((item) => result.append(key, item))
    else result.set(key, value)
  }
  return result
}

async function readBody(req: IncomingMessage, limit = 8192): Promise<string> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = chunk as Buffer
    size += buffer.length
    if (size > limit) throw new Error('payload too large')
    chunks.push(buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

function devApiPlugin(): Plugin {
  return {
    name: 'ihl-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const rawUrl = req.url ?? ''
        if (!rawUrl.startsWith('/api/')) return next()

        const pathname = rawUrl.split('?')[0].replace(/\/$/, '') || '/'
        const modulePath = API_ROUTES[pathname]
        if (!modulePath) return next()

        try {
          const mod = (await server.ssrLoadModule(modulePath)) as {
            default: (request: Request) => Promise<Response>
          }
          const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host ?? 'localhost'
          const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req)
          const request = new Request(new URL(rawUrl, `http://${host}`), {
            method: req.method,
            headers: toHeaders(req.headers),
            body,
          })
          const response = await mod.default(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(await response.text())
        } catch (error) {
          // Never echo the request payload or URL into the logs.
          console.error('[ihl] dev api error', error instanceof Error ? error.name : 'unknown')
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: false, error: { code: 'internal_error', message: 'Dev handler failed.' } }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
  },
})
