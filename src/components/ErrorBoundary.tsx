import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import { buttonStyles } from './ui/Button'

interface BoundaryProps {
  children: ReactNode
  title: string
  body: string
  reloadLabel: string
}

interface BoundaryState {
  hasError: boolean
}

/**
 * Last line of defence. A render error in one screen must not leave a blank
 * page — and the copy deliberately reminds the user that nothing is stored,
 * because a reload is genuinely the only thing needed.
 *
 * Nothing is reported anywhere: no error monitoring sees search data.
 */
class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log the error *type* only — never props, never the queried address.
    console.error('[ihl] render error', { name: error.name, componentStack: info.componentStack?.slice(0, 200) })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-warn/30 bg-warn/10">
          <AlertTriangle className="h-5 w-5 text-warn" aria-hidden />
        </span>
        <h1 className="mt-5 text-balance text-[24px] font-semibold tracking-tightest text-ink sm:text-[28px]">
          {this.props.title}
        </h1>
        <p className="mt-3 max-w-md text-pretty text-[13.5px] leading-6 text-muted">{this.props.body}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={buttonStyles({ variant: 'secondary', className: 'mt-7' })}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {this.props.reloadLabel}
        </button>
      </div>
    )
  }
}

/** Translated wrapper — the boundary itself is a class component. */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const key = (value: TranslationKey) => t(value)

  return (
    <ErrorBoundary
      title={key('errors.crash.title')}
      body={key('errors.crash.body')}
      reloadLabel={key('errors.crash.reload')}
    >
      {children}
    </ErrorBoundary>
  )
}
