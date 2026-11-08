import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white hover:bg-[#e13f3f] active:bg-[#d63939] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] disabled:bg-[#5c2626] disabled:text-white/60',
  secondary:
    'border border-line bg-rail text-ink hover:border-[#333a47] hover:bg-[#1f242e] active:bg-[#181c24]',
  ghost: 'text-muted hover:bg-rail/70 hover:text-ink',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3 text-[13px]',
  md: 'h-11 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-[15px]',
}

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}): string {
  return cn(
    'inline-flex select-none items-center justify-center rounded-xl font-medium transition-colors duration-150',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand/70',
    'disabled:cursor-not-allowed disabled:opacity-70',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className: cn(fullWidth && 'w-full', className) })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
}
