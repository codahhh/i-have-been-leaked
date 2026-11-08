import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import type { CheckResponse } from '@/types'
import { useI18n } from '@/i18n'
import { useResults } from '@/state/ResultsContext'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { PhoneSearchForm } from '@/components/PhoneSearchForm'
import { PrivacyNotice } from '@/components/PrivacyNotice'

export function PhoneChecker() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { setResult } = useResults()

  const handleResult = useCallback(
    (phone: string, result: CheckResponse) => {
      setResult('phone', { identifier: phone, result })
      navigate('/check/phone/results')
    },
    [navigate, setResult],
  )

  return (
    <div className="shell">
      <PageHeader
        eyebrow={`/ ${t('search.type.phone.title')}`}
        title={t('phone.page.title')}
        lede={t('phone.page.lede')}
      />

      <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
        <Card className="p-5 sm:p-7">
          <PhoneSearchForm onResult={handleResult} autoFocus variant="full" />
        </Card>

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
                <p className="text-[13px] font-medium text-ink">{t('phone.scope.title')}</p>
                <p className="mt-1.5 text-[12px] leading-5 text-muted">
                  {t('phone.scope.body')}
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
