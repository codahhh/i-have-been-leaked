import { useI18n } from '@/i18n'
import { PageHeader } from '@/components/PageHeader'
import { Article, CodeBlock, Section } from '@/components/Prose'

const ENDPOINTS = [
  { method: 'POST', path: '/api/check-email', key: 'docs.api.checkEmail' },
  { method: 'GET', path: '/api/password-range', key: 'docs.api.passwordRange' },
  { method: 'GET', path: '/api/providers', key: 'docs.api.providers' },
  { method: 'GET', path: '/api/breach-stats', key: 'docs.api.breachStats' },
] as const

export function Documentation() {
  const { t } = useI18n()

  return (
    <div className="shell">
      <PageHeader
        eyebrow={`/ ${t('nav.documentation')}`}
        title={t('docs.title')}
        lede={t('docs.lede')}
      />

      <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
        <Article className="space-y-8">
          <Section id="architecture" title={t('docs.arch.title')} index={1}>
            <p>{t('docs.arch.body')}</p>
            <CodeBlock>{`src/            React + TypeScript (no secret)
netlify/
  functions/    HTTP entry points only
  lib/          config · providers · merge · handlers
  lib/handlers/ orchestration + response shape`}</CodeBlock>
          </Section>

          <Section id="api" title={t('docs.api.title')} index={2}>
            <div className="space-y-2">
              {ENDPOINTS.map((endpoint) => (
                <div
                  key={endpoint.path}
                  className="rounded-xl border border-line-soft bg-surface p-4"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-md border border-line bg-rail px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                      {endpoint.method}
                    </span>
                    <code className="font-mono text-[12px] text-ink">{endpoint.path}</code>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-6 text-muted">{t(endpoint.key)}</p>
                </div>
              ))}
            </div>
            <CodeBlock>{`POST /api/check-email
{ "email": "you@example.com", "consent": true }

200 →
{ "state": "breached | clean | incomplete | error",
  "totalBreaches": 12,
  "breaches": [ { "id", "name", "domain", "breachDate",
                  "exposedData", "source", "sources" } ],
  "providers": [ { "provider", "status", "responded", "error" } ] }`}</CodeBlock>
          </Section>

          <Section id="environment" title={t('docs.env.title')} index={3}>
            <ul className="space-y-2">
              <li className="flex flex-col gap-1">
                <code className="font-mono text-[12px] text-ink">NODE_VERSION</code>
                <span>{t('docs.env.node')}</span>
              </li>
            </ul>
            <p>{t('docs.env.none')}</p>
          </Section>

          <Section id="deployment" title={t('docs.deploy.title')} index={4}>
            <p>{t('docs.deploy.body')}</p>
            <CodeBlock>{`# local
npm install
npm run dev        # Vite + the real Netlify handlers on /api/*

# production
npm run build      # typecheck + bundle to dist/
netlify deploy --prod`}</CodeBlock>
          </Section>

          <Section id="limits" title={t('docs.limits.title')} index={5}>
            <p>{t('docs.limits.body')}</p>
          </Section>

          <Section id="providers" title={t('docs.extend.title')} index={6}>
            <p>{t('docs.extend.body')}</p>
            <CodeBlock>{`// netlify/lib/config.ts
export const PROVIDERS = {
  myprovider: {
    id: 'myprovider',
    lookups: ['username'],
    timeoutMs: 6000,
    apiKeyEnvVar: 'MYPROVIDER_API_KEY',
    endpoints: { checkEmail: (email) => \`…\${email}\` },
  },
}`}</CodeBlock>
          </Section>
        </Article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line-soft bg-surface p-5">
            <h2 className="eyebrow">{t('docs.api.title')}</h2>
            <ul className="mt-3 space-y-1.5">
              {ENDPOINTS.map((endpoint) => (
                <li key={endpoint.path} className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] uppercase text-faint">
                    {endpoint.method}
                  </span>
                  <a
                    href="#api"
                    className="font-mono text-[11.5px] text-muted transition-colors hover:text-ink"
                  >
                    {endpoint.path}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line-soft bg-surface p-5">
            <h2 className="eyebrow">{t('docs.env.title')}</h2>
            <p className="mt-3 font-mono text-[11.5px] leading-6 text-muted">
              {t('docs.env.noneShort')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
