import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import { RequestError, type RequestErrorCode } from '@/services/api'
import { Button } from './ui/Button'
import { cn } from '@/utils/cn'

const MESSAGES: Record<RequestErrorCode, { title: TranslationKey; body: TranslationKey }> = {
  network_error: { title: 'errors.network.title', body: 'errors.network.body' },
  timeout: { title: 'errors.timeout.title', body: 'errors.timeout.body' },
  rate_limited: { title: 'errors.rate_limited.title', body: 'errors.rate_limited.body' },
  server_error: { title: 'errors.server.title', body: 'errors.server.body' },
  invalid_response: { title: 'errors.invalid_response.title', body: 'errors.invalid_response.body' },
  invalid_email: { title: 'errors.invalid_email.title', body: 'errors.invalid_email.body' },
  invalid_request: { title: 'errors.generic.title', body: 'errors.generic.body' },
  consent_required: { title: 'errors.generic.title', body: 'validation.consent.required' },
}

/** Translated, actionable error panel. Never shows raw provider text. */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown
  onRetry?: () => void
  className?: string
}) {
  const { t } = useI18n()

  const code: RequestErrorCode =
    error instanceof RequestError ? error.code : 'server_error'
  const message = MESSAGES[code] ?? MESSAGES.server_error
  const retryAfter = error instanceof RequestError ? error.retryAfterSeconds : null

  return (
    <div
      role="alert"
      className={cn(
        'rounded-2xl border border-warn/25 bg-warn/[0.06] p-5 sm:p-6',
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-warn/30 bg-warn/10">
          <AlertTriangle className="h-4 w-4 text-warn" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-ink">{t(message.title)}</p>
          <p className="mt-1.5 text-[13px] leading-6 text-muted">
            {code === 'rate_limited' && retryAfter
              ? t('errors.rate_limited.body', { seconds: retryAfter })
              : t(message.body)}
          </p>

          {onRetry ? (
            <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
