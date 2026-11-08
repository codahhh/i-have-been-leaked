import { cn } from '@/utils/cn'

/** Content-shaped placeholder used while a lookup is in flight. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-shimmer rounded-md bg-rail', className)}
      aria-hidden
    />
  )
}

/** Indeterminate progress bar — a single sweep, no bouncing gradient. */
export function Progress({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative h-1 w-full overflow-hidden rounded-full bg-line', className)}
      role="progressbar"
      aria-valuetext="in progress"
    >
      <div className="absolute inset-y-0 left-0 w-1/3 animate-sweep rounded-full bg-brand" />
    </div>
  )
}

/** Small coloured dot, optionally pulsing (in-flight states only). */
export function StatusDot({
  tone,
  pulse = false,
  className,
}: {
  tone: 'neutral' | 'ok' | 'warn' | 'danger' | 'brand'
  pulse?: boolean
  className?: string
}) {
  const colors: Record<string, string> = {
    neutral: 'bg-faint',
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-brand',
    brand: 'bg-brand',
  }
  return (
    <span className={cn('relative flex h-2 w-2 shrink-0', className)} aria-hidden>
      <span className={cn('h-2 w-2 rounded-full', colors[tone], pulse && 'animate-pulseDot')} />
    </span>
  )
}
