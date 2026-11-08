import { useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Brand mark: a red tile with a droplet knocked out of it (a leak), paired
 * with a lowercase wordmark. No third-party asset, no font dependency.
 */
export function LogoMark({ className }: { className?: string }) {
  // Multiple marks can live on one page: the gradient needs a unique id.
  const gradientId = useId()

  return (
    <svg
      viewBox="0 0 28 28"
      className={cn('h-7 w-7', className)}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="1" x2="24" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F87171" />
          <stop offset="1" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="27" height="27" rx="8" fill={`url(#${gradientId})`} />
      <rect
        x="0.5"
        y="0.5"
        width="27"
        height="27"
        rx="8"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.22"
      />
      <path
        d="M14 6.2c3.28 3.56 5.42 6.2 5.42 8.98a5.42 5.42 0 0 1-10.84 0c0-2.78 2.14-5.42 5.42-8.98Z"
        fill="#0A0B0E"
      />
      <path
        d="M11.4 14.1c0 1.75 1.15 3.2 2.75 3.5"
        stroke="#FCA5A5"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('text-[15px] font-semibold tracking-tightest text-ink', className)}>
      i have been <span className="text-brand">leaked</span>
    </span>
  )
}
