import { Link } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import { cn } from '@/utils/cn'

/**
 * Reusable privacy band. Every claim here is enforced by the implementation:
 * no storage, no analytics, no server-side retention of the query.
 */
export function PrivacyNotice({
  titleKey = 'home.privacy.title',
  bodyKey = 'home.privacy.body',
  linkKey = 'home.privacy.link',
  className,
}: {
  titleKey?: TranslationKey
  bodyKey?: TranslationKey
  linkKey?: TranslationKey
  className?: string
}) {
  const { t } = useI18n()

  return (
    <div
      className={cn(
        'rounded-2xl border border-line-soft bg-surface p-5 sm:p-7',
        className,
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-rail">
            <Lock className="h-4 w-4 text-muted" aria-hidden />
          </span>
          <div className="max-w-xl">
            <h2 className="text-[15px] font-medium text-ink">{t(titleKey)}</h2>
            <p className="mt-2 text-[13.5px] leading-6 text-muted">{t(bodyKey)}</p>
          </div>
        </div>
        <Link
          to="/privacy"
          className="group inline-flex shrink-0 items-center gap-1.5 self-start text-[13px] text-ink transition-colors hover:text-brand"
        >
          {t(linkKey)}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  )
}
