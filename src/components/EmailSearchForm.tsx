import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react'
import type { CheckResponse } from '@/types'
import { useI18n } from '@/i18n'
import { checkEmail } from '@/services/check'
import { loadProviders } from '@/services/providers'
import { isValidEmail, MAX_EMAIL_LENGTH } from '@/utils/validation'
import { cn } from '@/utils/cn'
import { Button } from './ui/Button'
import { TextField } from './ui/TextField'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

const DEFAULT_PROVIDERS = ['XposedOrNot', 'LeakCheck']

export function joinWithConjunction(items: string[], language: 'fr' | 'en'): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  const conjunction = language === 'fr' ? 'et' : 'and'
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`
}

interface EmailSearchFormProps {
  onResult: (email: string, result: CheckResponse) => void
  variant?: 'full' | 'compact'
  autoFocus?: boolean
  className?: string
}

/**
 * Email lookup form.
 *
 * The submit button is never the gate: validation and consent are checked on
 * submit so the user always gets an explicit, translated reason. The request
 * itself is refused server-side without `consent: true`.
 */
export function EmailSearchForm({
  onResult,
  variant = 'full',
  autoFocus = false,
  className,
}: EmailSearchFormProps) {
  const { t, lang } = useI18n()
  const fieldId = useId()
  const checkboxRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [consentError, setConsentError] = useState(false)
  const [pending, setPending] = useState(false)
  const [requestError, setRequestError] = useState<unknown>(null)
  const [providers, setProviders] = useState<string[]>(DEFAULT_PROVIDERS)

  useEffect(() => {
    let cancelled = false
    loadProviders()
      .then((data) => {
        if (cancelled) return
        const names = data.providers
          .filter((provider) => provider.activeForEmail)
          .map((provider) => provider.displayName)
        if (names.length > 0) setProviders(names)
      })
      .catch(() => {
        /* capability listing is decorative: the default names stay accurate */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const providerList = joinWithConjunction(providers, lang)

  const submit = useCallback(async () => {
    setRequestError(null)
    const value = email.trim()

    if (value.length === 0) {
      setFieldError(t('validation.email.required'))
      return
    }
    if (value.length > MAX_EMAIL_LENGTH) {
      setFieldError(t('validation.email.tooLong'))
      return
    }
    if (!isValidEmail(value)) {
      setFieldError(t('validation.email.invalid'))
      return
    }
    if (!consent) {
      setConsentError(true)
      checkboxRef.current?.focus()
      return
    }

    setFieldError(null)
    setConsentError(false)
    setPending(true)
    try {
      const result = await checkEmail(value, true)
      onResult(value, result)
    } catch (error) {
      setRequestError(error)
    } finally {
      setPending(false)
    }
  }, [consent, email, onResult, t])

  if (pending) {
    return <LoadingState providers={providers} className={className} />
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className={cn('w-full', className)}
    >
      <TextField
        id={`${fieldId}-email`}
        label={t('email.form.label')}
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        autoCapitalize="none"
        placeholder={t('email.form.placeholder')}
        icon={Mail}
        value={email}
        autoFocus={autoFocus}
        error={fieldError}
        onChange={(event) => {
          setEmail(event.target.value)
          if (fieldError) setFieldError(null)
        }}
        trailing={
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-faint sm:block">
            @
          </span>
        }
      />

      {/* Disclosure shown before anything is sent — required by design. */}
      <div
        className={cn(
          'mt-4 rounded-xl border border-line-soft bg-surface',
          variant === 'full' ? 'p-4' : 'p-3.5',
        )}
      >
        {variant === 'full' ? (
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
            <div>
              <p className="text-[13px] font-medium text-ink">{t('email.consent.title')}</p>
              <p className="mt-1 text-[12.5px] leading-5 text-muted">
                {t('email.consent.body', { providers: providerList })}
              </p>
            </div>
          </div>
        ) : null}

        <label
          className={cn(
            'flex cursor-pointer items-start gap-2.5',
            variant === 'full' ? 'mt-3.5' : 'mt-0',
          )}
        >
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked)
              if (event.target.checked) setConsentError(false)
            }}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line accent-brand"
            aria-describedby={consentError ? `${fieldId}-consent-error` : undefined}
            aria-invalid={consentError || undefined}
          />
          <span className="text-[12.5px] leading-5 text-muted">
            {t('email.consent.checkbox', { providers: providerList })}{' '}
            <Link to="/privacy" className="link">
              {t('email.consent.privacyLink')}
            </Link>
          </span>
        </label>

        {consentError ? (
          <p
            id={`${fieldId}-consent-error`}
            role="alert"
            className="mt-2 text-[12px] text-[#FCA5A5]"
          >
            {t('validation.consent.required')}
          </p>
        ) : null}

        <p className="mt-2 text-[11.5px] leading-5 text-faint">{t('email.consent.noAnonymity')}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-faint">{t('email.form.hint')}</p>
        <Button type="submit" size="md" className="min-w-[132px]">
          {t('email.form.submit')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {requestError ? (
        <ErrorState error={requestError} onRetry={() => void submit()} className="mt-4" />
      ) : null}
    </form>
  )
}
