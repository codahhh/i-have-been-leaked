/**
 * Builds the Vercel entry points.
 *
 * Vercel's Node runtime loads `api/*.js` as plain Node modules. A relative
 * import of a TypeScript file outside `api/` (which is what we want to write)
 * cannot be resolved at runtime, so each entry is bundled into a single
 * self-contained ES module here. The bundles contain the real handler — no
 * duplicated logic, no mocks.
 *
 * Run automatically by `npm run build`; the output is committed so the files
 * are present whichever order the host collects functions in.
 */

import { build } from 'esbuild'
import { writeFile } from 'node:fs/promises'

/** route file → exported handler in netlify/lib/handlers */
const ROUTES = [
  { file: 'api/check-email.js', handler: 'handleCheckEmail', module: 'netlify/lib/handlers/checkLookup.ts' },
  { file: 'api/check-username.js', handler: 'handleCheckUsername', module: 'netlify/lib/handlers/checkLookup.ts' },
  { file: 'api/providers.js', handler: 'handleProviders', module: 'netlify/lib/handlers/providers.ts' },
  { file: 'api/password-range.js', handler: 'handlePasswordRange', module: 'netlify/lib/handlers/passwordRange.ts' },
  { file: 'api/breach-stats.js', handler: 'handleBreachStats', module: 'netlify/lib/handlers/breachStats.ts' },
]

const BANNER = `/**
 * GENERATED FILE — do not edit.
 * Source: netlify/lib/handlers/* , bundled by scripts/build-vercel-api.mjs.
 * Regenerate with: npm run build:api
 */
`

for (const route of ROUTES) {
  const entry = `
import { ${route.handler} } from './${route.module}'
import { readWebRequest, sendWebResponse } from './netlify/lib/webAdapter.ts'

export default async function handler(req, res) {
  const request = await readWebRequest(req)
  const response = await ${route.handler}(request)
  await sendWebResponse(response, res)
}
`

  const result = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), sourcefile: 'vercel-entry.ts', loader: 'ts' },
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    legalComments: 'none',
    write: false,
    logLevel: 'warning',
    banner: { js: BANNER },
  })

  const output = result.outputFiles[0]
  await writeFile(route.file, output.text, 'utf8')
  console.log(`  ${route.file}  ${(output.text.length / 1024).toFixed(1)} kB`)
}
