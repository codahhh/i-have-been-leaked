import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import type { CheckResponse } from '@/types'
import { useI18n } from '@/i18n'
import { useResults } from '@/state/ResultsContext'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { UsernameSearchForm } from '@/components/UsernameSearchForm'

export function UsernameChecker() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { setResult } = useResults()

  const handleResult = useCallback(
    (username: string, result: CheckResponse) => {
      setResult('username', { identifier: username, result })
      navigate('/check/username/results')
    },
    [navigate, setResult],
  )

  return (
    <div className="shell">
      <PageHeader
        eyebrow={`/ ${t('search.type.username.title')}`}
        title={t('username.page.title')}
        lede={t('username.page.lede')}
      />

      <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
        <Card className="p-5 sm:p-7">
          <UsernameSearchForm onResult={handleResult} autoFocus variant="full" />
        </Card>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line-soft bg-surface p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-faint" aria-hidden />
              <div>
                <h2 className="text-[13px] font-medium text-ink">{t('username.page.scope.title')}</h2>
                <p className="mt-1.5 text-[12px] leading-5 text-muted">
                  {t('username.page.scope.body')}
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/documentation"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-line-soft bg-surface p-5 transition-colors hover:border-line"
          >
            <span className="text-[13px] text-ink">{t('nav.documentation')}</span>
            <ArrowRight
              className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </aside>
      </div>
    </div>
  )
}
