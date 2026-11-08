import { useI18n } from '@/i18n'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { PhoneSearchForm } from '@/components/PhoneSearchForm'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function PhoneChecker() {
  const { t } = useI18n()

  return (
    <div className="shell">
      <PageHeader
        eyebrow={`/ ${t('search.type.phone.title')}`}
        title={t('phone.page.title')}
        lede={t('phone.page.lede')}
      />

      <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
        <Card className="p-5 sm:p-7">
          <PhoneSearchForm autoFocus alwaysShow />
        </Card>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line-soft bg-surface p-5">
            <h2 className="eyebrow">{t('docs.extend.title')}</h2>
            <p className="mt-3 text-[12px] leading-5 text-muted">{t('docs.extend.body')}</p>
          </div>
          <Link
            to="/documentation"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-line-soft bg-surface p-5 transition-colors hover:border-line"
          >
            <span className="text-[13px] text-ink">{t('nav.documentation')}</span>
            <ArrowRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </aside>
      </div>
    </div>
  )
}
