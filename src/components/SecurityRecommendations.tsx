import { KeyRound, RefreshCw, ShieldCheck, Smartphone, UserX, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'

const ITEMS: Array<{
  icon: LucideIcon
  titleKey: TranslationKey
  bodyKey: TranslationKey
}> = [
  { icon: RefreshCw, titleKey: 'rec.password.title', bodyKey: 'rec.password.body' },
  { icon: UserX, titleKey: 'rec.reuse.title', bodyKey: 'rec.reuse.body' },
  { icon: ShieldCheck, titleKey: 'rec.tfa.title', bodyKey: 'rec.tfa.body' },
  { icon: Smartphone, titleKey: 'rec.phishing.title', bodyKey: 'rec.phishing.body' },
  { icon: KeyRound, titleKey: 'rec.manager.title', bodyKey: 'rec.manager.body' },
]

export function SecurityRecommendations({
  showPasswordLink = true,
}: {
  showPasswordLink?: boolean
}) {
  const { t } = useI18n()

  return (
    <section aria-labelledby="recommendations-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="recommendations-title" className="text-[17px] font-semibold tracking-tight text-ink">
          {t('rec.title')}
        </h2>
        {showPasswordLink ? (
          <Link to="/check/password" className="link text-[12.5px]">
            {t('nav.password')} →
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ITEMS.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={item.titleKey}
              className="rounded-xl border border-line-soft bg-surface p-4 sm:p-5"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-rail">
                  <Icon className="h-3.5 w-3.5 text-muted" aria-hidden />
                </span>
                <div>
                  <h3 className="text-[13.5px] font-medium leading-5 text-ink">
                    {t(item.titleKey)}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-5 text-muted">{t(item.bodyKey)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-[11.5px] leading-5 text-faint">{t('rec.disclaimer')}</p>
    </section>
  )
}
