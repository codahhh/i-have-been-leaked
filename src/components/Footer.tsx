import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import { LogoMark, Wordmark } from './Logo'

const CHECKS: Array<{ to: string; key: TranslationKey }> = [
  { to: '/check/email', key: 'nav.email' },
  { to: '/check/username', key: 'nav.username' },
  { to: '/check/phone', key: 'nav.phone' },
  { to: '/check/password', key: 'nav.password' },
]

const RESOURCES: Array<{ to: string; key: TranslationKey }> = [
  { to: '/documentation', key: 'nav.documentation' },
  { to: '/about', key: 'nav.about' },
  { to: '/privacy', key: 'nav.privacy' },
]

const SOURCES = [
  { href: 'https://xposedornot.com', label: 'XposedOrNot' },
  // Attribution required by LeakCheck's public API terms.
  { href: 'https://leakcheck.io', label: 'Powered by LeakCheck' },
  { href: 'https://haveibeenpwned.com/Passwords', label: 'HIBP · Pwned Passwords' },
]

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="mt-24 border-t border-line-soft bg-[#06070A]">
      <div className="shell py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          <div className="max-w-xs">
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label={t('brand.name')}>
              <LogoMark className="h-6 w-6" />
              <Wordmark />
            </Link>
            <p className="mt-4 text-[13px] leading-6 text-faint">{t('footer.tagline')}</p>
          </div>

          <FooterColumn title={t('footer.product')}>
            {CHECKS.map((item) => (
              <Link key={item.to} to={item.to} className="link-quiet block py-1 text-[13px]">
                {t(item.key)}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title={t('footer.legal')}>
            {RESOURCES.map((item) => (
              <Link key={item.to} to={item.to} className="link-quiet block py-1 text-[13px]">
                {t(item.key)}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title={t('footer.sources')}>
            {SOURCES.map((source) => (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-quiet group flex items-center gap-1 py-1 text-[13px]"
              >
                {source.label}
                <ArrowUpRight
                  className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70"
                  aria-hidden
                />
                <span className="sr-only">({t('a11y.externalLink')})</span>
              </a>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line-soft pt-6 text-[12px] text-faint md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl leading-5">{t('footer.disclaimer')}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em]">
            {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="eyebrow mb-3">{title}</h2>
      <div>{children}</div>
    </div>
  )
}
