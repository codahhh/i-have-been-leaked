import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-ink focus:outline focus:outline-2 focus:outline-brand"
      >
        {t('nav.skipToContent')}
      </a>

      <Header />

      <main id="main" className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  )
}
