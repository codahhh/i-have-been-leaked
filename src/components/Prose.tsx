import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Article({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('max-w-[68ch]', className)}>{children}</div>
}

export function Section({
  id,
  title,
  children,
  index,
}: {
  id: string
  title: string
  children: ReactNode
  index?: number
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line-soft pt-7 first:border-0 first:pt-0">
      <h2 className="flex items-baseline gap-3 text-[15px] font-semibold tracking-tight text-ink">
        {index !== undefined ? (
          <span className="font-mono text-[11px] font-normal text-faint">
            {String(index).padStart(2, '0')}
          </span>
        ) : null}
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[13.5px] leading-7 text-muted">{children}</div>
    </section>
  )
}

export function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-line bg-[#0A0B0F] p-3.5 font-mono text-[11.5px] leading-6 text-muted">
      <code>{children}</code>
    </pre>
  )
}
