import { useState } from 'react'
import { CalendarDays, Database, Users } from 'lucide-react'
import type { NormalizedBreach } from '@/types'
import { useI18n } from '@/i18n'
import { classifyExposedData } from '@/utils/exposedData'
import { cn } from '@/utils/cn'
import { Badge } from './ui/Badge'

const COLLAPSE_THRESHOLD = 200

/**
 * One normalised breach. Everything shown here comes from a provider payload:
 * when a field is missing we say so instead of guessing.
 */
export function BreachResultCard({ breach, index }: { breach: NormalizedBreach; index: number }) {
  const { t, formatDate, formatNumber } = useI18n()
  const [expanded, setExpanded] = useState(false)

  const monogram = breach.name.trim().slice(0, 2).toUpperCase()
  const hasLongDescription =
    breach.description !== null && breach.description.length > COLLAPSE_THRESHOLD

  return (
    <article
      className="card p-5 transition-colors hover:border-[#2b3140] sm:p-6"
      style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
      data-testid="breach-card"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/[0.07] font-mono text-[12px] font-medium text-[#FCA5A5]"
            aria-hidden
          >
            {monogram}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-medium leading-6 text-ink">{breach.name}</h3>
            {breach.domain ? (
              <p className="truncate font-mono text-[11.5px] text-faint">{breach.domain}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {breach.sources.map((source) => (
            <Badge key={source} tone="outline">
              {source}
            </Badge>
          ))}
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line-soft pt-4 sm:grid-cols-[1fr_1fr]">
        <div>
          <dt className="eyebrow mb-1.5 flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" aria-hidden />
            {t('breach.date')}
          </dt>
          <dd className={cn('text-[13px]', breach.breachDate ? 'text-ink' : 'text-faint')}>
            {breach.breachDate ? formatDate(breach.breachDate) : t('breach.dateUnknown')}
          </dd>
        </div>
        <div>
          <dt className="eyebrow mb-1.5 flex items-center gap-1.5">
            <Users className="h-3 w-3" aria-hidden />
            {t('breach.accounts')}
          </dt>
          <dd className={cn('text-[13px]', breach.pwnCount ? 'text-ink' : 'text-faint')}>
            {breach.pwnCount ? formatNumber(breach.pwnCount) : t('common.notAvailable')}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <p className="eyebrow mb-2.5 flex items-center gap-1.5">
          <Database className="h-3 w-3" aria-hidden />
          {t('breach.exposed')}
        </p>
        {breach.exposedData.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {breach.exposedData.map((raw) => {
              const category = classifyExposedData(raw)
              const Icon = category.icon
              return (
                <li key={raw}>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[11.5px] text-muted">
                    <Icon className="h-3 w-3 text-faint" aria-hidden />
                    {category.key ? t(category.key) : category.raw}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-[12.5px] text-faint">{t('breach.exposedUnknown')}</p>
        )}
      </div>

      {breach.description ? (
        <div className="mt-5 border-t border-line-soft pt-4">
          <p className="text-[13px] leading-6 text-muted">
            {hasLongDescription && !expanded
              ? `${breach.description.slice(0, COLLAPSE_THRESHOLD).trimEnd()}…`
              : breach.description}
          </p>
          {hasLongDescription ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-2 text-[12.5px] text-ink underline decoration-line underline-offset-4 transition-colors hover:text-brand"
              aria-expanded={expanded}
            >
              {t(expanded ? 'breach.less' : 'breach.more')}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
