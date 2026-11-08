import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import { cn } from '@/utils/cn'
import { LogoMark, Wordmark } from './Logo'
import { LanguageSwitcher } from './LanguageSwitcher'

const NAV: Array<{ to: string; key: TranslationKey }> = [
  { to: '/check/email', key: 'nav.email' },
  { to: '/check/username', key: 'nav.username' },
  { to: '/check/phone', key: 'nav.phone' },
  { to: '/check/password', key: 'nav.password' },
  { to: '/documentation', key: 'nav.documentation' },
]

export function Header() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // A navigation always collapses the mobile panel.
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-base/85 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md py-1 pr-1"
          aria-label={t('brand.name')}
        >
          <LogoMark />
          <Wordmark className="hidden sm:inline" />
        </Link>

        <nav className="hidden h-16 items-stretch gap-7 lg:flex" aria-label={t('a11y.primaryNav')}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center text-[13.5px] transition-colors',
                  isActive ? 'text-ink' : 'text-muted hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {t(item.key)}
                  {isActive ? (
                    <span
                      className="absolute inset-x-0 -bottom-px h-px bg-brand"
                      aria-hidden
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t(open ? 'nav.closeMenu' : 'nav.openMenu')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-ink lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="animate-fade border-t border-line-soft bg-base lg:hidden"
        >
          <nav className="shell flex flex-col py-2" aria-label={t('a11y.primaryNav')}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[46px] items-center justify-between border-b border-line-soft/70 text-[15px] last:border-0',
                    isActive ? 'text-ink' : 'text-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{t(item.key)}</span>
                    {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-brand" /> : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
