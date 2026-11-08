import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone = 'neutral' | 'red' | 'green' | 'amber' | 'outline'

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-line bg-rail/80 text-muted',
  red: 'border-brand/30 bg-brand/10 text-[#FCA5A5]',
  green: 'border-ok/25 bg-ok/10 text-[#86EFAC]',
  amber: 'border-warn/25 bg-warn/10 text-[#FCD34D]',
  outline: 'border-line bg-transparent text-muted',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  children: ReactNode
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
