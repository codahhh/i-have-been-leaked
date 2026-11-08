import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Server, UserX } from 'lucide-react'
import type { EmailCheckResponse } from '@/types'
import { useI18n } from '@/i18n'
import { useResults } from '@/state/ResultsContext'
import { HighlightedText } from '@/utils/highlight'
import { SearchTypeSelector, SEARCH_TYPES, type SearchType } from '@/components/SearchTypeSelector'
import { EmailSearchForm } from '@/components/EmailSearchForm'
import { PasswordSearchForm } from '@/components/PasswordSearchForm'
import { UsernameSearchForm } from '@/components/UsernameSearchForm'
import { PhoneSearchForm } from '@/components/PhoneSearchForm'
import { ProviderOverview } from '@/components/ProviderOverview'
import { BreachStatsPanel } from '@/components/BreachStatsPanel'
import { PrivacyNotice } from '@/components/PrivacyNotice'
import { SectionHeading } from '@/components/PageHeader'
import { buttonStyles } from '@/components/ui/Button'

const STEPS = [
  { title: 'home.how.step1.title', body: 'home.how.step1.body' },
  { title: 'home.how.step2.title', body: 'home.how.step2.body' },
  { title: 'home.how.step3.title', body: 'home.how.step3.body' },
] as const

export function Home() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { setEmailResult } = useResults()
  const [type, setType] = useState<SearchType>('email')

  const handleEmailResult = useCallback(
    (email: string, result: EmailCheckResponse) => {
      setEmailResult({ email, result })
      navigate('/check/email/results')
    },
    [navigate, setEmailResult],
  )

  const activeType = SEARCH_TYPES.find((item) => item.id === type)

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden border-b border-line-soft">
        <div className="pointer-events-none absolute inset-0 grid-texture" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] hero-glow" aria-hidden />

        <div className="shell relative pb-16 pt-14 sm:pt-16 md:pb-24 md:pt-24">
          <div className="stagger mx-auto max-w-3xl text-center">
            <p className="eyebrow inline-flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              {t('home.eyebrow')}
            </p>

            <h1 className="mt-6 text-balance text-[clamp(1.85rem,6.6vw,4.15rem)] font-semibold leading-[1.03] tracking-tightest text-ink">
              <HighlightedText
                text={t('home.hero.title')}
                highlight={t('home.hero.highlight')}
                className="text-brand"
              />
            </h1>

            <p className="mx-auto mt-6 max-w-[38rem] text-pretty text-[15px] leading-7 text-muted sm:text-[16px]">
              {t('home.hero.lede')}
            </p>
          </div>

          {/* ------------------------------------------------ search panel */}
          <div className="mx-auto mt-10 max-w-2xl animate-rise [animation-delay:120ms]">
            <div className="rounded-2xl border border-line bg-card p-2 shadow-[0_40px_100px_-60px_rgba(239,68,68,0.45)]">
              <div className="px-1 pt-1">
                <SearchTypeSelector value={type} onChange={setType} idPrefix="home" />
              </div>

              <div
                id="home-panel"
                role="tabpanel"
                aria-labelledby={`home-tab-${type}`}
                className="mt-2 rounded-xl border border-line-soft bg-base/50 p-4 sm:p-5"
              >
                {activeType ? (
                  <p className="mb-4 text-[12.5px] leading-5 text-faint">{t(activeType.descriptionKey)}</p>
                ) : null}

                {type === 'email' ? (
                  <EmailSearchForm onResult={handleEmailResult} variant="compact" />
                ) : null}
                {type === 'password' ? <PasswordSearchForm compact /> : null}
                {type === 'username' ? <UsernameSearchForm compact /> : null}
                {type === 'phone' ? <PhoneSearchForm compact /> : null}
              </div>
            </div>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
              <TrustItem icon={Lock} label={t('home.trust.storage')} />
              <TrustItem icon={UserX} label={t('home.trust.account')} />
              <TrustItem icon={Server} label={t('home.trust.providers')} />
            </ul>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- how it works */}
      <section className="shell py-16 md:py-20">
        <SectionHeading eyebrow="§ 01" title={t('home.how.title')} />

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line-soft sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="bg-base p-6 sm:p-7">
              <span className="font-mono text-[11px] tracking-[0.1em] text-faint">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-[14px] font-medium text-ink">{t(step.title)}</h3>
              <p className="mt-2 text-[12.5px] leading-6 text-muted">{t(step.body)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- providers */}
      <section className="shell pb-16 md:pb-20">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-14">
          <div>
            <SectionHeading
              eyebrow="§ 02"
              title={t('home.providers.title')}
              lede={t('home.providers.body')}
            />
          </div>
          <ProviderOverview />
        </div>
      </section>

      {/* ----------------------------------------------------------- stats */}
      <section className="shell pb-16 md:pb-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <SectionHeading eyebrow="§ 03" title={t('home.stats.title')} />
          <p className="max-w-sm text-[12px] leading-5 text-faint">
            {t('home.stats.lede', { source: 'XposedOrNot' })}
          </p>
        </div>
        <BreachStatsPanel />
      </section>

      {/* --------------------------------------------------------- privacy */}
      <section className="shell pb-16 md:pb-20">
        <PrivacyNotice />
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="shell pb-8">
        <div className="rounded-2xl border border-line bg-card px-6 py-10 text-center sm:px-10 sm:py-12">
          <h2 className="mx-auto max-w-lg text-balance text-[22px] font-semibold tracking-tight text-ink sm:text-[26px]">
            {t('home.cta.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-[13.5px] leading-6 text-muted">
            {t('home.cta.body')}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/check/email" className={buttonStyles({ size: 'md' })}>
              {t('home.cta.button')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/check/password"
              className={buttonStyles({ variant: 'secondary', size: 'md' })}
            >
              {t('nav.password')}
            </Link>
          </div>
          <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            {t('home.cta.note')}
          </p>
        </div>
      </section>
    </>
  )
}

function TrustItem({
  icon: Icon,
  label,
}: {
  icon: typeof Lock
  label: string
}) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-faint" aria-hidden />
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{label}</span>
    </li>
  )
}
