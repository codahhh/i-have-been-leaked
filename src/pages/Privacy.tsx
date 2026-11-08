import { Check } from 'lucide-react'
import { useI18n } from '@/i18n'
import { PageHeader } from '@/components/PageHeader'
import { Article, Section } from '@/components/Prose'
import type { TranslationKey } from '@/i18n/fr'

const SUMMARY_ITEMS: TranslationKey[] = [
  'privacy.summary.item1',
  'privacy.summary.item2',
  'privacy.summary.item3',
  'privacy.summary.item4',
]

const SECTIONS: Array<{ id: string; title: TranslationKey; body: TranslationKey }> = [
  { id: 'collection', title: 'privacy.s1.title', body: 'privacy.s1.body' },
  { id: 'providers', title: 'privacy.s2.title', body: 'privacy.s2.body' },
  { id: 'passwords', title: 'privacy.s3.title', body: 'privacy.s3.body' },
  { id: 'logs', title: 'privacy.s4.title', body: 'privacy.s4.body' },
  { id: 'storage', title: 'privacy.s5.title', body: 'privacy.s5.body' },
  { id: 'security', title: 'privacy.s6.title', body: 'privacy.s6.body' },
  { id: 'rights', title: 'privacy.s7.title', body: 'privacy.s7.body' },
  { id: 'guarantee', title: 'privacy.s8.title', body: 'privacy.s8.body' },
]

/** Kept in sync with the policy text itself. */
const LAST_UPDATED = '2026-11-08'

export function Privacy() {
  const { t, formatDate } = useI18n()

  return (
    <div className="shell">
      <PageHeader
        eyebrow={`/ ${t('nav.privacy')}`}
        title={t('privacy.title')}
        lede={t('privacy.lede')}
        aside={
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
            {t('privacy.updated', { date: formatDate(LAST_UPDATED) })}
          </p>
        }
      />

      <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
        <Article className="space-y-8">
          {SECTIONS.map((section, index) => (
            <Section key={section.id} id={section.id} title={t(section.title)} index={index + 1}>
              <p>{t(section.body)}</p>
              {section.id === 'providers' ? (
                <ul className="space-y-1.5 pt-1 text-[13px]">
                  <li>
                    <a
                      href="https://xposedornot.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      {t('privacy.s2.xon')} ↗
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://docs.leakcheck.io/public-api/lookup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      {t('privacy.s2.leakcheck')} ↗
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://haveibeenpwned.com/Privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      Have I Been Pwned ↗
                    </a>
                  </li>
                </ul>
              ) : null}
            </Section>
          ))}
        </Article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line-soft bg-surface p-5">
            <h2 className="eyebrow">{t('privacy.summary.title')}</h2>
            <ul className="mt-4 space-y-3">
              {SUMMARY_ITEMS.map((key) => (
                <li key={key} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ok/30 bg-ok/10">
                    <Check className="h-2.5 w-2.5 text-ok" aria-hidden />
                  </span>
                  <span className="text-[12.5px] leading-5 text-muted">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label={t('privacy.title')} className="mt-4 rounded-2xl border border-line-soft bg-surface p-5">
            <ul className="space-y-1.5">
              {SECTIONS.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-baseline gap-2 text-[12px] text-muted transition-colors hover:text-ink"
                  >
                    <span className="font-mono text-[10px] text-faint">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {t(section.title)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  )
}
