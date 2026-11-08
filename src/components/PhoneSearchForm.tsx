import { useId, useMemo, useState } from 'react'
import type { CountryCode } from 'libphonenumber-js'
import { ArrowRight, Phone } from 'lucide-react'
import { useI18n } from '@/i18n'
import { getCountryOptions, guessDefaultCountry, validatePhoneNumber } from '@/utils/phone'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { TextField } from './ui/TextField'
import { UnavailableLookup } from './UnavailableLookup'

function initialCountry(): CountryCode {
  if (typeof navigator === 'undefined') return 'FR'
  return guessDefaultCountry(navigator.language || 'fr-FR')
}

/**
 * Phone checker (V1).
 *
 * The input is genuinely international: country selection, libphonenumber
 * validation, E.164 normalisation. No provider covers phone numbers yet, so the
 * outcome is an explicit "unavailable" state — never a fabricated "clean".
 */
export function PhoneSearchForm({
  autoFocus = false,
  compact = false,
  alwaysShow = false,
}: {
  autoFocus?: boolean
  compact?: boolean
  /** Render the unavailable panel before any submission (dedicated pages). */
  alwaysShow?: boolean
}) {
  const { t, lang } = useI18n()
  const fieldId = useId()

  const countries = useMemo(() => getCountryOptions(lang === 'fr' ? 'fr' : 'en'), [lang])
  const [country, setCountry] = useState<CountryCode>(initialCountry)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const parsed = useMemo(() => validatePhoneNumber(value, country), [value, country])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (value.trim().length === 0) {
      setError(t('validation.phone.required'))
      return
    }
    if (!parsed.ok) {
      setError(
        parsed.reason === 'unrecognized'
          ? t('validation.phone.unrecognized')
          : t('validation.phone.invalid'),
      )
      return
    }

    setError(null)
    setSubmitted(parsed.e164)
  }

  return (
    <div className="space-y-6">
      <form noValidate onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Select
            id={`${fieldId}-country`}
            label={t('phone.form.country')}
            value={country}
            onChange={(event) => {
              setCountry(event.target.value as CountryCode)
              if (error) setError(null)
            }}
            aria-describedby={`${fieldId}-country-hint`}
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
            error={error}
            onChange={(event) => {
              setValue(event.target.value)
              if (error) setError(null)
            }}
          />
        </div>

        <p
          id={`${fieldId}-country-hint`}
          className="mt-2 flex min-h-[20px] items-center gap-2 text-[12px] text-faint"
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

        <div className="mt-4 flex items-center justify-end">
          <Button type="submit">
            {t('phone.form.submit')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </form>

      {submitted || alwaysShow ? (
        <UnavailableLookup
          titleKey="phone.unavailable.title"
          bodyKey="phone.unavailable.body"
          footnote={submitted ? <span className="font-mono">{submitted}</span> : undefined}
          reasons={[
            {
              titleKey: 'phone.unavailable.reason1.title',
              bodyKey: 'phone.unavailable.reason1.body',
            },
            {
              titleKey: 'phone.unavailable.reason2.title',
              bodyKey: 'phone.unavailable.reason2.body',
            },
            {
              titleKey: 'phone.unavailable.reason3.title',
              bodyKey: 'phone.unavailable.reason3.body',
            },
          ]}
          nextTitleKey="phone.unavailable.next"
          nextBodyKey="phone.unavailable.nextBody"
          compact={compact}
          moreLink={compact ? { to: '/check/phone', label: t('common.learnMore') } : undefined}
        />
      ) : null}
    </div>
  )
}
