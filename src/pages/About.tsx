import { Link } from 'react-router-dom'
import { ArrowRight, Terminal } from 'lucide-react'
import { useI18n } from '@/i18n'
import { PageHeader } from '@/components/PageHeader'
import { Article, Section } from '@/components/Prose'

export function About() {
  const { t } = useI18n()

  return (
    <div className="shell">
      <PageHeader eyebrow={`/ ${t('nav.about')}`} title={t('about.title')} lede={t('about.lede')} />

      <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
        <Article className="space-y-8">
          <Section id="why" title={t('about.why.title')} index={1}>
            <p>{t('about.why.body')}</p>
          </Section>
          <Section id="architecture" title={t('about.arch.title')} index={2}>
            <p>{t('about.arch.body')}</p>
          </Section>
          <Section id="limits" title={t('about.limits.title')} index={3}>
            <p>{t('about.limits.body')}</p>
          </Section>
          <Section id="stack" title={t('about.stack.title')} index={4}>
            <p>{t('about.stack.body')}</p>
          </Section>
          <Section id="contact" title={t('about.contact.title')} index={5}>
            <p>{t('about.contact.body')}</p>
          </Section>
        </Article>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line-soft bg-surface p-5">
            <p className="eyebrow">{t('footer.sources')}</p>
            <ul className="mt-3 space-y-2 text-[12.5px]">
              <li>
                <a
                  href="https://xposedornot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  XposedOrNot
                </a>
              </li>
              <li>
                <a href="https://orelys.io" target="_blank" rel="noopener noreferrer" className="link">
                  Orelys
                </a>
              </li>
              <li>
                <a
                  href="https://haveibeenpwned.com/Passwords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  Have I Been Pwned · Pwned Passwords
                </a>
              </li>
            </ul>
          </div>

          <Link
            to="/documentation"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-line-soft bg-surface p-5 transition-colors hover:border-line"
          >
            <span className="text-[13px] text-ink">{t('nav.documentation')}</span>
            <ArrowRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>

          <Link
            to="/privacy"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-line-soft bg-surface p-5 transition-colors hover:border-line"
          >
            <span className="text-[13px] text-ink">{t('nav.privacy')}</span>
            <ArrowRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>

          <p className="flex items-center gap-2 px-1 text-[11.5px] text-faint">
            <Terminal className="h-3.5 w-3.5" aria-hidden />
            codahhh/i-have-been-leaked
          </p>
        </aside>
      </div>
    </div>
  )
}
