import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/i18n'
import { buttonStyles } from '@/components/ui/Button'

export function NotFound() {
  const { t } = useI18n()

  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">404</p>
      <h1 className="mt-4 text-balance text-[28px] font-semibold tracking-tightest text-ink sm:text-[34px]">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 max-w-sm text-[13.5px] leading-6 text-muted">{t('notFound.body')}</p>
      <Link to="/" className={buttonStyles({ variant: 'secondary', className: 'mt-7' })}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('notFound.action')}
      </Link>
    </div>
  )
}
