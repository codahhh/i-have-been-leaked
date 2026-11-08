import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { ProviderResult, ProviderStatusKind } from '@/types'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import { cn } from '@/utils/cn'
import { Badge, type BadgeTone } from './ui/Badge'
import { StatusDot } from './ui/Feedback'

const STATUS_META: Record<
  ProviderStatusKind,
  { label: TranslationKey; tone: BadgeTone; dot: 'ok' | 'warn' | 'neutral' | 'danger' }
> = {
  ok: { label: 'provider.status.ok', tone: 'green', dot: 'ok' },
  not_found: { label: 'provider.status.not_found', tone: 'green', dot: 'ok' },
  not_configured: { label: 'provider.status.not_configured', tone: 'neutral', dot: 'neutral' },
  unavailable: { label: 'provider.status.unavailable', tone: 'amber', dot: 'warn' },
  timeout: { label: 'provider.status.timeout', tone: 'amber', dot: 'warn' },
  rate_limited: { label: 'provider.status.rate_limited', tone: 'amber', dot: 'warn' },
  invalid_response: { label: 'provider.status.invalid_response', tone: 'amber', dot: 'warn' },
}

/**
 * Reports what each provider actually did. This component is the reason the UI
 * can never imply that an unanswered source is a clean result.
 */
export function ProviderStatus({
  providers,
  className,
}: {
  providers: ProviderResult[]
  className?: string
}) {
  const { t, tp, formatDateTime, formatDuration } = useI18n()

  return (
    <ul className={cn('divide-y divide-line-soft', className)}>
      {providers.map((provider) => {
        const meta = STATUS_META[provider.status] ?? STATUS_META.unavailable
        return (
          <li key={provider.provider} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <StatusDot tone={meta.dot} />
              <span className="text-[13.5px] font-medium text-ink">{provider.displayName}</span>
              <Badge tone={meta.tone}>{t(meta.label)}</Badge>
              <span className="mono ml-auto text-[11px] text-faint">
                {formatDuration(provider.durationMs)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-5 text-[12px] text-faint">
              {/* The badge already says "answered" — only name the silence. */}
              {provider.responded ? null : (
                <>
                  <span className="text-warn">{t('provider.respondedNo')}</span>
                  <span aria-hidden>·</span>
                </>
              )}
              <span className="mono">
                {t('provider.queriedAt', { time: formatDateTime(provider.queriedAt) })}
              </span>
              {provider.breaches.length > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{tp('results.list.count', provider.breaches.length)}</span>
                </>
              ) : null}
            </div>

            {/* LeakCheck reports data categories once for the whole query,
                never per breach — labelled as such so it is not misread. */}
            {provider.exposedCategories.length > 0 ? (
              <p className="pl-5 text-[11.5px] leading-5 text-faint">
                {t('provider.categories', {
                  categories: provider.exposedCategories.join(' · '),
                })}
              </p>
            ) : null}

            {provider.error ? (
              <details className="group pl-5">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[12px] text-faint transition-colors hover:text-muted">
                  <ChevronRight
                    className="h-3 w-3 transition-transform group-open:rotate-90"
                    aria-hidden
                  />
                  {t('provider.detail')}
                </summary>
                <div className="mt-2 rounded-lg border border-line-soft bg-base/60 px-3 py-2">
                  <p className="text-[12.5px] leading-5 text-muted">
                    {t(`provider.error.${provider.error.code}` as TranslationKey)}
                  </p>
                  {provider.error.detail ? (
                    <p className="mt-1 font-mono text-[11px] leading-5 text-faint">
                      {provider.error.detail}
                    </p>
                  ) : null}
                  {provider.error.retryAfterSeconds ? (
                    <p className="mt-1 text-[11.5px] text-faint">
                      {t('provider.retryAfter', { seconds: provider.error.retryAfterSeconds })}
                    </p>
                  ) : null}
                  {provider.status === 'not_configured' ? (
                    <Link to="/documentation" className="link mt-1 inline-block text-[11.5px]">
                      {t('provider.notConfiguredHelp')}
                    </Link>
                  ) : null}
                </div>
              </details>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
