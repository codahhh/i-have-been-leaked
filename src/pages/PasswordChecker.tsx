import { Fingerprint, Hash, WifiOff } from 'lucide-react'
import { useI18n } from '@/i18n'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { PasswordSearchForm } from '@/components/PasswordSearchForm'
import { SecurityRecommendations } from '@/components/SecurityRecommendations'

const GUARANTEES = [
  { icon: Fingerprint, key: 'password.form.localOnly' },
  { icon: Hash, key: 'password.note.autofill' },
  { icon: WifiOff, key: 'password.note.exit' },
] as const

export function PasswordChecker() {
  const { t } = useI18n()

  return (
    <div className="shell">
      <PageHeader
        eyebrow={`/ ${t('search.type.password.title')}`}
        title={t('password.page.title')}
        lede={t('password.page.lede')}
      />

      <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
        <Card className="p-5 sm:p-7">
          <PasswordSearchForm autoFocus />
        </Card>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line-soft bg-surface p-5">
            <h2 className="eyebrow">{t('password.aside.title')}</h2>
            <ul className="mt-4 space-y-3">
              {GUARANTEES.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.key} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" aria-hidden />
                    <span className="text-[12px] leading-5 text-muted">{t(item.key)}</span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 border-t border-line-soft pt-4 text-[11.5px] leading-5 text-faint">
              {t('password.how.why')}
            </p>
          </div>
        </aside>
      </div>

      <div className="pb-6">
        <SecurityRecommendations showPasswordLink={false} />
      </div>
    </div>
  )
}
