import type { InputHTMLAttributes, ReactNode } from 'react'
import { AlertCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  id: string
  label: string
  icon?: LucideIcon
  error?: string | null
  hint?: ReactNode
  trailing?: ReactNode
  containerClassName?: string
  inputClassName?: string
}

/**
 * Labelled input with optional leading icon and trailing control.
 * Errors are wired with aria-describedby so screen readers announce them.
 */
export function TextField({
  id,
  label,
  icon: Icon,
  error,
  hint,
  trailing,
  containerClassName,
  inputClassName,
  ...rest
}: TextFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('w-full', containerClassName)}>
      <label
        htmlFor={id}
        className="mb-2 block text-[13px] font-medium text-muted"
      >
        {label}
      </label>

      <div
        className={cn(
          'group flex items-center gap-2.5 rounded-xl border bg-surface px-3.5 transition-colors',
          'focus-within:border-[#3b4250] focus-within:bg-[#12151b]',
          error ? 'border-brand/60' : 'border-line',
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              error ? 'text-brand' : 'text-faint group-focus-within:text-muted',
            )}
            aria-hidden
          />
        ) : null}

        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'h-12 w-full min-w-0 bg-transparent text-[15px] text-ink outline-none',
            'placeholder:text-[#7A8290]',
            inputClassName,
          )}
          {...rest}
        />

        {trailing ? <div className="flex shrink-0 items-center gap-1">{trailing}</div> : null}
      </div>

      {error ? (
        <p id={errorId} className="mt-2 flex items-start gap-1.5 text-[13px] text-[#FCA5A5]">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-2 text-[12.5px] leading-5 text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
