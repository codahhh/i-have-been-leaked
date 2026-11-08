import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CountryCode } from 'libphonenumber-js'
import { ArrowRight, Info, Phone, ShieldCheck } from 'lucide-react'
import type { CheckResponse } from '@/types'
import { useI18n } from '@/i18n'
import { checkPhone } from '@/services/check'
import { loadProviders } from '@/services/providers'
import { getCountryOptions, guessDefaultCountry, validatePhoneNumber } from '@/utils/phone'
import { cn } from '@/utils/cn'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { TextField } from './ui/TextField'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { joinWithConjunction } from './EmailSearchForm'

function initialCountry(): CountryCode {
  if (typeof navigator === 'undefined') return 'FR'
  return guessDefaultCountry(navigator.language || 'fr-FR')
}

interface PhoneSearchFormProps {
  onResult: (phone: string, result: CheckResponse) => void
  variant?: 'full' | 'compact'
  autoFocus?: boolean
  className?: string
}

/**
 * Phone lookup form.
 *
 * The input is genuinely international: country selection, libphonenumber
 * validation, E.164 normalisation — the number is rewritten to `+33612345678`
 * before anything is sent. Only one free source answers phone searches
 * (LeakCheck's public tier), and the panel says so instead of letting a
 * "no match" read as proof of safety: a number can be recycled, and public
 * indexes only list what they happened to collect.
 */
export function PhoneSearchForm({
  onResult,
  variant = 'full',
  autoFocus = false,
  className,
}: PhoneSearchFormProps) {
  const { t, lang } = useI18n()
  const fieldId = useId()
  const checkboxRef = useRef<HTMLInputElement>(null)

  const countries = getCountryOptionsSafe(lang)
  const [country, setCountry] = useState<CountryCode>(initialCountry)
  const [value, setValue] = useState('')
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
          .filter((provider) => provider.activeForPhone)
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
  const parsed = validatePhoneNumber(value, country)

  const submit = useCallback(async () => {
    setRequestError(null)

    if (value.trim().length === 0) {
      setFieldError(t('validation.phone.required'))
      return
    }
    if (!parsed.ok) {
      setFieldError(
        parsed.reason === 'unrecognized'
          ? t('validation.phone.unrecognized')
          : t('validation.phone.invalid'),
      )
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
      // `parsed.e164` is the canonical form; the server strips the `+`.
      const result = await checkPhone(parsed.e164, true)
      onResult(parsed.e164, result)
    } catch (error) {
      setRequestError(error)
    } finally {
      setPending(false)
    }
  }, [consent, onResult, parsed, t, value])

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
      <div className="grid gap-3 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Select
          id={`${fieldId}-country`}
          label={t('phone.form.country')}
          value={country}
          onChange={(event) => {
            setCountry(event.target.value as CountryCode)
            if (fieldError) setFieldError(null)
          }}
          aria-describedby={`${fieldId}-hint`}
        >
          {countries.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name} · {option.dial}
            </option>
          ))}
        </Select>

        <TextField
          id={`${fieldId}-phone`}
          label={t('phone.form.label')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t('phone.form.placeholder')}
          icon={Phone}
          value={value}
          autoFocus={autoFocus}
          error={fieldError}
          onChange={(event) => {
            setValue(event.target.value)
            if (fieldError) setFieldError(null)
          }}
        />
      </div>

      <p
        id={`${fieldId}-hint`}
        className="mt-2 flex min-h-[20px] flex-wrap items-center gap-2 text-[12px] text-faint"
      >
        {parsed.ok ? (
          <>
            <span className="inline-flex items-center rounded-md border border-ok/25 bg-ok/10 px-1.5 py-0.5 font-mono text-[11px] text-[#86EFAC]">
              E.164
            </span>
            <span className="font-mono text-[12px] text-muted">
              {t('phone.form.e164', { e164: parsed.e164 })}
            </span>
          </>
        ) : (
          t('phone.form.countryHint')
        )}
      </p>

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
              <p className="text-[13px] font-medium text-ink">{t('phone.consent.title')}</p>
              <p className="mt-1 text-[12.5px] leading-5 text-muted">
                {t('phone.consent.body', { providers: providerList })}
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
            {t('phone.consent.checkbox', { providers: providerList })}{' '}
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
            {t('phone.consent.coverage')}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-faint">{t('phone.form.note')}</p>
        <Button type="submit" size="md" className="min-w-[132px]">
          {t('phone.form.submit')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {requestError ? (
        <ErrorState error={requestError} onRetry={() => void submit()} className="mt-4" />
      ) : null}
    </form>
  )
}

/** `getCountryOptions` is pure but keeps an internal cache; keep the call lazy. */
function getCountryOptionsSafe(lang: string) {
  return getCountryOptions(lang === 'fr' ? 'fr' : 'en')
}
