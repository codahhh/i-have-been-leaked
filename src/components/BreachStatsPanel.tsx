import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { BreachStats } from '@/types'
import { useI18n } from '@/i18n'
import { loadBreachStats } from '@/services/providers'
import { Skeleton } from './ui/Feedback'

type LoadState = 'loading' | 'ready' | 'unavailable'

/**
 * Aggregate figures only — fetched from a real public index at request time.
 * If the source cannot be reached, the section says so instead of showing
 * invented numbers (or a zero that would read like a real figure).
 */
export function BreachStatsPanel() {
  const { t, formatNumber, formatDate } = useI18n()
  const [state, setState] = useState<LoadState>('loading')
  const [stats, setStats] = useState<BreachStats | null>(null)

  useEffect(() => {
    let cancelled = false
    loadBreachStats()
      .then((data) => {
        if (cancelled) return
        if (!data.available) {
          setState('unavailable')
          return
        }
        setStats(data)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'loading') {
    return (
      <div className="card p-6 sm:p-7">
        <p className="mb-5 text-[12.5px] text-faint">{t('home.stats.loading')}</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    )
  }

  if (state === 'unavailable' || !stats) {
    return (
      <div className="rounded-2xl border border-line-soft bg-surface p-6">
        <p className="max-w-xl text-[13px] leading-6 text-muted">{t('home.stats.unavailable')}</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <dl className="grid grid-cols-1 divide-y divide-line-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat
          label={t('home.stats.breaches')}
          value={Number.isFinite(stats.totalBreaches) ? formatNumber(stats.totalBreaches) : '—'}
        />
        <Stat
          label={t('home.stats.records')}
          value={stats.totalRecords ? formatNumber(stats.totalRecords, { compact: true }) : '—'}
          exact={stats.totalRecords ? formatNumber(stats.totalRecords) : undefined}
        />
        <Stat
          label={t('home.stats.latest')}
          value={stats.latestBreach?.name ?? '—'}
          caption={
            stats.latestBreach?.date ? formatDate(stats.latestBreach.date) : undefined
          }
          mono={false}
        />
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-6 py-3.5">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint">
          {t('common.source')} · {stats.source}
        </p>
        <a
          href={stats.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11.5px] text-muted transition-colors hover:text-ink"
        >
          xposedornot.com
          <ArrowUpRight className="h-3 w-3" aria-hidden />
          <span className="sr-only">({t('a11y.externalLink')})</span>
        </a>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  caption,
  exact,
  mono = true,
}: {
  label: string
  value: string
  caption?: string
  exact?: string
  mono?: boolean
}) {
  return (
    <div className="px-6 py-5">
      <dt className="eyebrow">{label}</dt>
      <dd
        className={
          mono
            ? 'mt-2 truncate font-mono text-[26px] leading-none tracking-tight text-ink'
            : 'mt-2 truncate text-[17px] font-medium leading-tight text-ink'
        }
        title={exact}
      >
        {value}
      </dd>
      {caption ? <p className="mt-1.5 font-mono text-[11px] text-faint">{caption}</p> : null}
    </div>
  )
}
