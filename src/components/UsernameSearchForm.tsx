import { useId, useState } from 'react'
import { ArrowRight, AtSign } from 'lucide-react'
import { useI18n } from '@/i18n'
import { isValidUsername, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@/utils/validation'
import { Button } from './ui/Button'
import { TextField } from './ui/TextField'
import { UnavailableLookup } from './UnavailableLookup'

/**
 * Username checker (V1).
 *
 * The form is real — validation runs, the value is normalised — but no lookup
 * is performed and no result is fabricated. The panel states why, and how a
 * future provider would slot in.
 */
export function UsernameSearchForm({
  autoFocus = false,
  compact = false,
  alwaysShow = false,
}: {
  autoFocus?: boolean
  compact?: boolean
  /** Render the unavailable panel before any submission (dedicated pages). */
  alwaysShow?: boolean
}) {
  const { t } = useI18n()
  const fieldId = useId()

  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const value = username.trim()

    if (value.length === 0) {
      setError(t('validation.username.required'))
      return
    }
    if (!isValidUsername(value)) {
      setError(t('validation.username.invalid'))
      return
    }

    setError(null)
    setSubmitted(value)
  }

  return (
    <div className="space-y-6">
      <form noValidate onSubmit={handleSubmit}>
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
          error={error}
          maxLength={USERNAME_MAX_LENGTH}
          onChange={(event) => {
            setUsername(event.target.value)
            if (error) setError(null)
          }}
          hint={t('validation.username.invalid').replace(/^.*?:\s*/, '')}
          trailing={
            <span className="font-mono text-[10px] text-faint">
              {username.trim().length >= USERNAME_MIN_LENGTH ? '✓' : ''}
            </span>
          }
        />

        <div className="mt-4 flex items-center justify-end">
          <Button type="submit">
            {t('username.form.submit')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </form>

      {submitted || alwaysShow ? (
        <UnavailableLookup
          titleKey="username.unavailable.title"
          bodyKey="username.unavailable.body"
          footnote={submitted ? t('username.unavailable.result', { username: submitted }) : undefined}
          reasons={[
            {
              titleKey: 'username.unavailable.reason1.title',
              bodyKey: 'username.unavailable.reason1.body',
            },
            {
              titleKey: 'username.unavailable.reason2.title',
              bodyKey: 'username.unavailable.reason2.body',
            },
            {
              titleKey: 'username.unavailable.reason3.title',
              bodyKey: 'username.unavailable.reason3.body',
            },
          ]}
          nextTitleKey="username.unavailable.next"
          nextBodyKey="username.unavailable.nextBody"
          compact={compact}
          moreLink={compact ? { to: '/check/username', label: t('common.learnMore') } : undefined}
        />
      ) : null}
    </div>
  )
}
