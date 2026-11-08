import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, AtSign, Info, ShieldCheck } from 'lucide-react'
import type { CheckResponse } from '@/types'
import { useI18n } from '@/i18n'
import { checkUsername } from '@/services/check'
import { loadProviders } from '@/services/providers'
import { isValidUsername, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@/utils/validation'
import { cn } from '@/utils/cn'
import { Button } from './ui/Button'
import { TextField } from './ui/TextField'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { joinWithConjunction } from './EmailSearchForm'

interface UsernameSearchFormProps {
  onResult: (username: string, result: CheckResponse) => void
  variant?: 'full' | 'compact'
  autoFocus?: boolean
  className?: string
}

/**
 * Username lookup form.
 *
 * A username is only looked up in the sources that really support it. The
 * coverage notice is not decoration: username coverage is narrower than email
 * coverage, and a "no match" therefore means less. Saying that plainly is the
 * whole point — the form never dresses an empty answer up as safety.
 */
export function UsernameSearchForm({
  onResult,
  variant = 'full',
  autoFocus = false,
  className,
}: UsernameSearchFormProps) {
  const { t, lang } = useI18n()
  const fieldId = useId()
  const checkboxRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [consent, setConsent] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [consentError, setConsentError] = useState(false)
  const [pending, setPending] = useState(false)
  const [requestError, setRequestError] = useState<unknown>(null)
  const [providers, setProviders] = useState<string[]>(['LeakCheck'])

  useEffect(() => {
    let cancelled = false
    loadProviders()
      .then((data) => {
        if (cancelled) return
        const names = data.providers
          .filter((provider) => provider.activeForUsername)
          .map((provider) => provider.displayName)
        if (names.length > 0) setProviders(names)
      })
      .catch(() => {
        /* capability listing is decorative: the default name stays accurate */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const providerList = joinWithConjunction(providers, lang)

  const submit = useCallback(async () => {
    setRequestError(null)
    const value = username.trim()

    if (value.length === 0) {
      setFieldError(t('validation.username.required'))
      return
    }
    if (!isValidUsername(value)) {
      setFieldError(t('validation.username.invalid'))
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
      const result = await checkUsername(value, true)
      onResult(value, result)
    } catch (error) {
      setRequestError(error)
    } finally {
      setPending(false)
    }
  }, [consent, onResult, t, username])

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
        id={`${fieldId}-username`}
        label={t('username.form.label')}
        type="text"
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="none"
        placeholder={t('username.form.placeholder')}
        icon={AtSign}
        value={username}
        autoFocus={autoFocus}
        error={fieldError}
        maxLength={USERNAME_MAX_LENGTH}
        onChange={(event) => {
          setUsername(event.target.value)
          if (fieldError) setFieldError(null)
        }}
        hint={
          username.trim().length > 0 && username.trim().length < USERNAME_MIN_LENGTH
            ? t('username.form.minLength', { count: USERNAME_MIN_LENGTH })
            : undefined
        }
      />

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
              <p className="text-[13px] font-medium text-ink">{t('username.consent.title')}</p>
              <p className="mt-1 text-[12.5px] leading-5 text-muted">
                {t('username.consent.body', { providers: providerList })}
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
            {t('username.consent.checkbox', { providers: providerList })}{' '}
            <Link to="/privacy" className="link">
              {t('email.consent.privacyLink')}
            </Link>
          </span>
        </label>

        {consentError ? (
          <p id={`${fieldId}-consent-error`} role="alert" className="mt-2 text-[12px] text-[#FCA5A5]">
            {t('validation.consent.required')}
          </p>
        ) : null}

        {variant === 'full' ? (
          <p className="mt-2 flex items-start gap-2 text-[11.5px] leading-5 text-faint">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('username.consent.coverage')}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-faint">{t('username.form.hint')}</p>
        <Button type="submit" size="md" className="min-w-[132px]">
          {t('username.form.submit')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {requestError ? (
        <ErrorState error={requestError} onRetry={() => void submit()} className="mt-4" />
      ) : null}
    </form>
  )
}
