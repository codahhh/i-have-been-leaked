import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import type { EmailCheckResponse } from '@/types'
import { useI18n } from '@/i18n'
import { useResults } from '@/state/ResultsContext'
import { PageHeader } from '@/components/PageHeader'
import { EmailSearchForm } from '@/components/EmailSearchForm'
import { PrivacyNotice } from '@/components/PrivacyNotice'

export function EmailChecker() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { setEmailResult } = useResults()

  const handleResult = useCallback(
    (email: string, result: EmailCheckResponse) => {
      setEmailResult({ email, result })
      navigate('/check/email/results')
    },
    [navigate, setEmailResult],
  )

  return (
    <div className="shell">
      <PageHeader
        eyebrow={`/ ${t('search.type.email.title')}`}
        title={t('email.page.title')}
        lede={t('email.page.lede')}
      />

      <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
        <div className="card p-5 sm:p-7">
          <EmailSearchForm onResult={handleResult} autoFocus variant="full" />
        </div>

        <aside className="space-y-4">
          <PrivacyNotice
            titleKey="home.privacy.title"
            bodyKey="home.privacy.body"
            linkKey="home.privacy.link"
          />

          <div className="rounded-2xl border border-line-soft bg-surface p-5">
            <div className="flex items-start gap-3">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-faint" aria-hidden />
              <div>
                <p className="text-[13px] font-medium text-ink">{t('email.page.sidebar.title')}</p>
                <p className="mt-1.5 text-[12px] leading-5 text-muted">
                  {t('email.page.sidebar.body')}
                </p>
              </div>
            </div>
            <Link
              to="/documentation"
              className="group mt-3 inline-flex items-center gap-1 text-[12px] text-ink transition-colors hover:text-brand"
            >
              {t('nav.documentation')}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
