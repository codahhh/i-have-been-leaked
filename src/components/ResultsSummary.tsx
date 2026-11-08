import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import type { EmailCheckResponse, LookupState } from '@/types'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import { cn } from '@/utils/cn'

interface StateTheme {
  icon: LucideIcon
  accent: string
  iconWrap: string
  iconColor: string
  titleKey: TranslationKey
  bodyKey: TranslationKey
  stateKey: TranslationKey
  /** Green / red / amber as specified — used for the top accent line. */
  rule: string
}

const THEMES: Record<LookupState, StateTheme> = {
  clean: {
    icon: CheckCircle2,
    accent: 'from-transparent via-ok/60 to-transparent',
    iconWrap: 'border-ok/30 bg-ok/10',
    iconColor: 'text-ok',
    titleKey: 'results.state.clean.title',
    bodyKey: 'results.state.clean.body',
    stateKey: 'results.summary.stateValue.clean',
    rule: 'bg-ok/60',
  },
  breached: {
    icon: ShieldAlert,
    accent: 'from-transparent via-brand/70 to-transparent',
    iconWrap: 'border-brand/35 bg-brand/10',
    iconColor: 'text-brand',
    titleKey: 'results.state.breached.title.other',
    bodyKey: 'results.state.breached.body',
    stateKey: 'results.summary.stateValue.breached',
    rule: 'bg-brand/70',
  },
  incomplete: {
    icon: AlertTriangle,
    accent: 'from-transparent via-warn/60 to-transparent',
    iconWrap: 'border-warn/30 bg-warn/10',
    iconColor: 'text-warn',
    titleKey: 'results.state.incomplete.title',
    bodyKey: 'results.state.incomplete.body',
    stateKey: 'results.summary.stateValue.incomplete',
    rule: 'bg-warn/60',
  },
  error: {
    icon: AlertCircle,
    accent: 'from-transparent via-faint/40 to-transparent',
    iconWrap: 'border-line bg-rail',
    iconColor: 'text-muted',
    titleKey: 'results.state.error.title',
    bodyKey: 'results.state.error.body',
    stateKey: 'results.summary.stateValue.error',
    rule: 'bg-line',
  },
}

export function ResultsSummary({
  result,
  email,
}: {
  result: EmailCheckResponse
  email: string
}) {
  const { t, tp, formatTimestamp, formatDuration, formatNumber } = useI18n()
  const theme = THEMES[result.state]
  const Icon = theme.icon

  const title =
    result.state === 'breached'
      ? tp('results.state.breached.title', result.totalBreaches)
      : t(theme.titleKey)

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-line bg-card"
      aria-label={t('a11y.results')}
      data-state={result.state}
    >
      <div className={cn('absolute inset-x-0 top-0 h-px', theme.rule)} aria-hidden />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                theme.iconWrap,
              )}
            >
              <Icon className={cn('h-5 w-5', theme.iconColor)} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="eyebrow">{t(theme.stateKey)}</p>
              <h2 className="mt-1.5 text-balance text-[22px] font-semibold leading-tight tracking-tight text-ink sm:text-[26px]">
                {title}
              </h2>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
              {t('results.for', { email })}
            </p>
            <p className="mt-1 text-[11.5px] text-faint">
              {t('results.checkedAt', { date: formatTimestamp(result.checkedAt) })}
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-pretty text-[13.5px] leading-6 text-muted">
          {t(theme.bodyKey)}
        </p>

        <dl className="mt-7 grid grid-cols-2 gap-y-5 border-t border-line-soft pt-5 sm:grid-cols-3 sm:divide-x sm:divide-line-soft">
          <Stat
            label={t('results.summary.breaches')}
            value={formatNumber(result.totalBreaches)}
            strong={result.totalBreaches > 0}
          />
          <Stat
            label={t('results.summary.providers')}
            value={`${result.respondingProviders}/${result.totalProviders}`}
            className="sm:pl-6"
          />
          <Stat
            label={t('results.summary.duration')}
            value={formatDuration(result.durationMs)}
            className="col-span-2 sm:col-span-1 sm:pl-6"
          />
        </dl>

        <p className="mt-5 text-[11.5px] leading-5 text-faint">{t('results.disclaimer')}</p>
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  className,
  strong = false,
}: {
  label: string
  value: string
  className?: string
  strong?: boolean
}) {
  return (
    <div className={className}>
      <dt className="eyebrow">{label}</dt>
      <dd
        className={cn(
          'mt-1.5 font-mono text-[20px] leading-none tracking-tight',
          strong ? 'text-brand' : 'text-ink',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
