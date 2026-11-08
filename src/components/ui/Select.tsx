import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  id: string
  label: string
  error?: string | null
  containerClassName?: string
}

/** Native select — the most reliable control on mobile, restyled for dark UI. */
export function Select({ id, label, error, containerClassName, children, ...rest }: SelectProps) {
  return (
    <div className={cn('w-full', containerClassName)}>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-muted">
        {label}
      </label>
      <div
        className={cn(
          'relative flex items-center rounded-xl border bg-surface transition-colors focus-within:border-[#3b4250]',
          error ? 'border-brand/60' : 'border-line',
        )}
      >
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          className="h-12 w-full appearance-none bg-transparent px-3.5 pr-10 text-[14px] text-ink outline-none [&>option]:bg-surface [&>option]:text-ink"
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-faint" aria-hidden />
      </div>
    </div>
  )
}
