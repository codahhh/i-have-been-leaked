import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Ban, Info, type LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import { cn } from '@/utils/cn'
import { Badge } from './ui/Badge'

export interface UnavailableReason {
  titleKey: TranslationKey
  bodyKey: TranslationKey
}

/**
 * Explicit "we cannot answer this" panel.
 *
 * Used by the username and phone checkers: the interface is functional and the
 * input is really validated, but no result is invented. The panel explains the
 * gap and what would be needed to close it.
 */
export function UnavailableLookup({
  icon: Icon = Ban,
  titleKey,
  bodyKey,
  reasons,
  nextTitleKey,
  nextBodyKey,
  footnote,
  className,
  compact = false,
  moreLink,
}: {
  icon?: LucideIcon
  titleKey: TranslationKey
  bodyKey: TranslationKey
  reasons: UnavailableReason[]
  nextTitleKey: TranslationKey
  nextBodyKey: TranslationKey
  footnote?: ReactNode
  className?: string
  /** Condensed variant used inside the homepage search panel. */
  compact?: boolean
  moreLink?: { to: string; label: string }
}) {
  const { t } = useI18n()

  return (
    <section
      className={cn('overflow-hidden rounded-2xl border border-line bg-card', className)}
      aria-live="polite"
      data-state="unavailable"
    >
      <div className="h-px w-full bg-warn/40" aria-hidden />

      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-rail">
            <Icon className="h-5 w-5 text-muted" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="amber">{t('common.notAvailable')}</Badge>
            </div>
            <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-ink sm:text-[22px]">
              {t(titleKey)}
            </h2>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-muted">{t(bodyKey)}</p>
            {footnote ? (
              <p className="mt-2 font-mono text-[12px] text-faint">{footnote}</p>
            ) : null}
          </div>
        </div>

        {compact ? (
          moreLink ? (
            <Link
              to={moreLink.to}
              className="group mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink transition-colors hover:text-brand"
            >
              {moreLink.label}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ) : null
        ) : (
        <>
        <ol className="mt-7 grid gap-4 border-t border-line-soft pt-6 sm:grid-cols-3">
          {reasons.map((reason, index) => (
            <li key={reason.titleKey}>
              <span className="font-mono text-[11px] text-faint">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-1.5 text-[13px] font-medium leading-5 text-ink">
                {t(reason.titleKey)}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-5 text-muted">{t(reason.bodyKey)}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-line-soft bg-surface p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-faint" aria-hidden />
          <div>
            <h3 className="text-[12.5px] font-medium text-ink">{t(nextTitleKey)}</h3>
            <p className="mt-1 text-[12.5px] leading-5 text-muted">{t(nextBodyKey)}</p>
          </div>
        </div>
        </>
        )}
      </div>
    </section>
  )
}
