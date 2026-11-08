import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n'
import { cn } from '@/utils/cn'
import { Progress, Skeleton } from './ui/Feedback'

/**
 * In-flight state for a lookup: indeterminate progress, the source that is
 * currently being contacted, elapsed time, and skeletons in the shape of the
 * result that is coming.
 */
export function LoadingState({
  providers,
  compact = false,
  className,
}: {
  providers?: string[]
  compact?: boolean
  className?: string
}) {
  const { t } = useI18n()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const timer = window.setInterval(() => setElapsed(Date.now() - started), 250)
    return () => window.clearInterval(timer)
  }, [])

  const seconds = elapsed / 1000
  const currentProvider = useMemo(() => {
    if (!providers || providers.length === 0) return null
    const index = Math.floor(elapsed / 1400) % providers.length
    return providers[index]
  }, [elapsed, providers])

  return (
    <div
      className={cn('card overflow-hidden p-6 sm:p-7', className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
            <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden />
          </span>
          <div>
            <p className="text-[14px] font-medium text-ink">{t('loading.title')}</p>
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
              {t('loading.step2', { count: providers?.length ?? 2 })}
            </p>
          </div>
        </div>
        <span className="mono shrink-0 text-faint">{t('loading.elapsed', { seconds: seconds.toFixed(1) })}</span>
      </div>

      <Progress className="mt-5" />

      <p className="mt-3 min-h-[18px] text-[12.5px] text-muted" aria-live="polite">
        {currentProvider
          ? t('loading.provider', { provider: currentProvider })
          : t('loading.step1')}
      </p>

      {!compact ? (
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-line-soft bg-surface p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="h-2.5 w-1/4" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-line-soft bg-surface p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-2.5 w-1/5" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {seconds > 6 ? (
        <p className="mt-4 text-[12px] leading-5 text-faint">{t('loading.slow')}</p>
      ) : null}
    </div>
  )
}
