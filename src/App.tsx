import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { I18nProvider, useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import { ResultsProvider } from '@/state/ResultsContext'
import { Layout } from '@/components/Layout'
import { AppErrorBoundary } from '@/components/ErrorBoundary'
import { Home } from '@/pages/Home'

/**
 * Everything except the homepage is code-split: the phone checker alone pulls
 * in libphonenumber metadata, which has no business in the first payload.
 */
const EmailChecker = lazy(() => import('@/pages/EmailChecker').then((m) => ({ default: m.EmailChecker })))
const ResultsPage = lazy(() => import('@/pages/Results').then((m) => ({ default: m.Results })))
const UsernameChecker = lazy(() => import('@/pages/UsernameChecker').then((m) => ({ default: m.UsernameChecker })))
const PhoneChecker = lazy(() => import('@/pages/PhoneChecker').then((m) => ({ default: m.PhoneChecker })))
const PasswordChecker = lazy(() => import('@/pages/PasswordChecker').then((m) => ({ default: m.PasswordChecker })))
const About = lazy(() => import('@/pages/About').then((m) => ({ default: m.About })))
const Privacy = lazy(() => import('@/pages/Privacy').then((m) => ({ default: m.Privacy })))
const Documentation = lazy(() => import('@/pages/Documentation').then((m) => ({ default: m.Documentation })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))

const PAGE_TITLES: Record<string, TranslationKey> = {
  '/': 'brand.tagline',
  '/check/email': 'email.page.title',
  '/check/email/results': 'results.title',
  '/check/username/results': 'results.title',
  '/check/username': 'username.page.title',
  '/check/phone': 'phone.page.title',
  '/check/phone/results': 'results.title',
  '/check/password': 'password.page.title',
  '/about': 'about.title',
  '/privacy': 'privacy.title',
  '/documentation': 'docs.title',
}

function DocumentMeta() {
  const { t, lang } = useI18n()
  const { pathname } = useLocation()

  useEffect(() => {
    const pageTitle = PAGE_TITLES[pathname] ?? 'notFound.title'
    document.title = `${t(pageTitle)} · ${t('brand.name')}`
  }, [pathname, t, lang])

  return null
}

function RouteFallback() {
  return (
    <div className="shell py-20" aria-busy="true">
      <div className="h-3 w-24 animate-shimmer rounded bg-rail" />
      <div className="mt-5 h-8 w-2/3 animate-shimmer rounded bg-rail" />
      <div className="mt-3 h-3 w-1/2 animate-shimmer rounded bg-rail" />
      <div className="mt-10 h-56 w-full animate-shimmer rounded-2xl bg-rail/60" />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    // Keyed wrapper: a subtle cross-fade on every navigation, disabled
    // automatically by the prefers-reduced-motion rule in index.css.
    <div key={location.pathname} className="animate-fade">
      <Suspense fallback={<RouteFallback />}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/check/email" element={<EmailChecker />} />
        <Route path="/check/email/results" element={<ResultsPage kind="email" />} />
        <Route path="/check/username" element={<UsernameChecker />} />
        <Route path="/check/username/results" element={<ResultsPage kind="username" />} />
        <Route path="/check/phone" element={<PhoneChecker />} />
        <Route path="/check/phone/results" element={<ResultsPage kind="phone" />} />
        <Route path="/check/password" element={<PasswordChecker />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </div>
  )
}

/**
 * Everything except the router. Exported so tests can mount the real
 * application tree inside a MemoryRouter.
 */
export function AppShell() {
  return (
    <I18nProvider>
      <ResultsProvider>
        <DocumentMeta />
        <Layout>
          <AppErrorBoundary>
            <AnimatedRoutes />
          </AppErrorBoundary>
        </Layout>
      </ResultsProvider>
    </I18nProvider>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
