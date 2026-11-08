import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, KeyRound } from 'lucide-react'
import type { ProvidersResponse } from '@/types'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'

/** Provider prose is localised here; the server string is the fallback. */
const COVERAGE_KEYS: Record<string, TranslationKey> = {
  xposedornot: 'provider.coverage.xposedornot',
  leakcheck: 'provider.coverage.leakcheck',
}
import { loadProviders } from '@/services/providers'
import { StatusDot } from './ui/Feedback'
import { Skeleton } from './ui/Feedback'

/**
 * Transparency strip: which sources exist, what they cover and whether this
 * deployment can query them. Data comes from `/api/providers`, so the UI can
 * never drift from the server configuration.
 */
export function ProviderOverview() {
  const { t } = useI18n()
  const [data, setData] = useState<ProvidersResponse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadProviders()
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (failed) {
    return (
      <div className="rounded-xl border border-line-soft bg-surface px-4 py-3.5">
        <p className="text-[12.5px] leading-5 text-muted">{t('home.stats.unavailable')}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    )
  }

  const emailProviders = (data.providers ?? []).filter((provider) => provider.activeForEmail)

  return (
    <div className="space-y-2">
      {emailProviders.map((provider) => (
        <div
          key={provider.id}
          className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface px-4 py-3.5"
        >
          <StatusDot tone={provider.configured ? 'ok' : 'warn'} className="mt-1.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13px] font-medium text-ink">{provider.displayName}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                {provider.configured
                  ? t('home.providers.statusOk')
                  : t('home.providers.statusNotConfigured')}
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-muted">
              {COVERAGE_KEYS[provider.id] ? t(COVERAGE_KEYS[provider.id]) : provider.coverage}
            </p>
          </div>
          <a
            href={provider.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 shrink-0 rounded-md p-1 text-faint transition-colors hover:text-ink"
            aria-label={`${provider.displayName} (${t('a11y.externalLink')})`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      ))}

      <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface px-4 py-3.5">
        <StatusDot tone="ok" className="mt-1.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[13px] font-medium text-ink">
              Have I Been Pwned · {t('home.providers.passwordSource')}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
              k-anonymity
            </span>
            <KeyRound className="h-3 w-3 text-faint" aria-hidden />
          </div>
          <p className="mt-1 text-[12px] leading-5 text-muted">
            {t('home.providers.passwordSourceBody')}
          </p>
        </div>
      </div>

      <p className="pt-1 text-[11.5px] leading-5 text-faint">
        {t('home.providers.notConfiguredNote')}{' '}
        <Link to="/documentation" className="link">
          {t('nav.documentation')}
        </Link>
      </p>
    </div>
  )
}
