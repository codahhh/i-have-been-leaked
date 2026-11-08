import { Link, Navigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, ShieldQuestion } from 'lucide-react'
import type { LookupKind } from '@/types'
import { useI18n } from '@/i18n'
import { useResults } from '@/state/ResultsContext'
import { ResultsSummary } from '@/components/ResultsSummary'
import { BreachResultCard } from '@/components/BreachResultCard'
import { ProviderStatus } from '@/components/ProviderStatus'
import { SecurityRecommendations } from '@/components/SecurityRecommendations'

const CHECKER_PATH: Record<LookupKind, string> = {
  email: '/check/email',
  username: '/check/username',
  phone: '/check/phone',
}

/**
 * Shared results view for every identifier kind.
 *
 * The verdict, the provider report and the advice are identical for an email,
 * a username and a phone number — what changes is the label of the thing that
 * was checked. A phone verdict carries one extra caveat, rendered by
 * `ResultsSummary`: numbers are recycled by carriers, so a match may not be
 * yours.
 */
export function Results({ kind }: { kind: LookupKind }) {
  const { t, tp } = useI18n()
  const { getResult } = useResults()
  const stored = getResult(kind)

  // Results only exist in memory: a reload sends the user back to the form
  // rather than restoring anything from storage.
  if (!stored) return <Navigate to={CHECKER_PATH[kind]} replace />

  const { identifier, result } = stored
  const hasBreaches = result.breaches.length > 0

  return (
    <div className="shell">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 pt-8">
        <Link
          to={CHECKER_PATH[kind]}
          className="group inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          />
          {t('common.newCheck')}
        </Link>
        <p className="eyebrow">{t('results.title')}</p>
      </div>

      <div className="pt-6">
        <ResultsSummary result={result} identifier={identifier} kind={kind} />
      </div>

      <div className="mt-8 grid gap-8 pb-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          {hasBreaches ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[17px] font-semibold tracking-tight text-ink">
                  {t('results.list.title')}
                </h2>
                <span className="mono text-faint">
                  {tp('results.list.count', result.totalBreaches)}
                </span>
              </div>

              <div className="stagger mt-4 space-y-3">
                {result.breaches.map((breach, index) => (
                  <BreachResultCard key={breach.id} breach={breach} index={index} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-line-soft bg-surface p-6">
              <div className="flex items-start gap-3">
                {result.state === 'clean' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden />
                ) : result.state === 'incomplete' ? (
                  <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                )}
                <div>
                  {/* The empty state must never contradict the verdict banner:
                      "error" is not "no match". */}
                  <p className="text-[13.5px] font-medium text-ink">
                    {result.state === 'clean'
                      ? t('results.state.clean.title')
                      : result.state === 'incomplete'
                        ? t('results.state.incomplete.title')
                        : t('results.state.error.title')}
                  </p>
                  <p className="mt-1.5 max-w-xl text-[12.5px] leading-6 text-muted">
                    {t('results.disclaimer')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside>
          <div className="card p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              {t('results.providers.title')}
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-faint">{t('results.providers.legend')}</p>
            <ProviderStatus providers={result.providers} className="mt-4" />
          </div>
        </aside>
      </div>

      {/* Full width, after both columns: on mobile the source status therefore
          sits directly under the verdict instead of below the advice. */}
      {result.state === 'error' ? null : (
        <div className="mt-10">
          <SecurityRecommendations />
        </div>
      )}
    </div>
  )
}
