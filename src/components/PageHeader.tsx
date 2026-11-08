import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  lede?: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('border-b border-line-soft pb-10 pt-12 md:pt-16', className)}>
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
          <h1 className="text-balance text-[30px] font-semibold leading-[1.12] tracking-tightest text-ink sm:text-[38px]">
            {title}
          </h1>
          {lede ? (
            <p className="mt-4 max-w-xl text-pretty text-[15px] leading-7 text-muted">{lede}</p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  lede?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h2 className="text-balance text-[22px] font-semibold leading-tight tracking-tight text-ink sm:text-[26px]">
        {title}
      </h2>
      {lede ? (
        <p className="mt-3 text-pretty text-[14.5px] leading-7 text-muted">{lede}</p>
      ) : null}
    </div>
  )
}
