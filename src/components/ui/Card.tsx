import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'quiet'
  children: ReactNode
}

export function Card({ variant = 'default', className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(variant === 'default' ? 'card' : 'card-quiet', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
