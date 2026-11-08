import { useId, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Eraser,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldAlert,
  ShieldX,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import {
  PasswordCheckError,
  checkPassword,
  isHashingAvailable,
  type PasswordCheckFailure,
  type PasswordCheckResult,
} from '@/services/pwnedPasswords'
import { cn } from '@/utils/cn'
import { Button } from './ui/Button'
import { TextField } from './ui/TextField'

const FAILURE_KEYS: Record<PasswordCheckFailure, TranslationKey> = {
  insecure_context: 'password.error.insecureContext',
  hash_unavailable: 'password.error.hashFailed',
  network_error: 'password.error.network',
  timeout: 'password.error.network',
  rate_limited: 'password.error.network',
  invalid_response: 'password.error.network',
}

/**
 * Password checker (k-anonymity).
 *
 * The password lives in this component's state only while it is being hashed,
 * then the field is cleared. It is never sent to our server, never stored, and
 * never placed in a URL — only a 5-character SHA-1 prefix leaves the browser.
 */
export function PasswordSearchForm({
  autoFocus = false,
  compact = false,
}: {
  autoFocus?: boolean
  compact?: boolean
}) {
  const { t } = useI18n()
  const fieldId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<PasswordCheckResult | null>(null)
  const [failure, setFailure] = useState<PasswordCheckFailure | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [wasCleared, setWasCleared] = useState(false)
  const [tooShort, setTooShort] = useState(false)

  const hashingAvailable = isHashingAvailable()

  async function runCheck() {
    if (password.length === 0) {
      setFieldError(t('password.error.empty'))
      return
    }

    if (!hashingAvailable) {
      setFailure('insecure_context')
      return
    }

    const length = password.length
    setFieldError(null)
    setFailure(null)
    setResult(null)
    setPending(true)

    try {
      const check = await checkPassword(password)
      setResult(check)
      setTooShort(length < 8 && !check.breached)
    } catch (error) {
      const reason = error instanceof PasswordCheckError ? error.reason : 'network_error'
      setFailure(reason)
      setTooShort(false)
    } finally {
      // Clear the input as soon as the digest has been computed and compared.
      setPassword('')
      setVisible(false)
      setWasCleared(true)
      setPending(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  function clearField() {
    setPassword('')
    setVisible(false)
    setResult(null)
    setFailure(null)
    setFieldError(null)
    setWasCleared(false)
    setTooShort(false)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-6">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void runCheck()
        }}
      >
        <TextField
          id={`${fieldId}-password`}
          label={t('password.form.label')}
          type={visible ? 'text' : 'password'}
          // A password checker must never trigger a saved-credential prompt.
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          placeholder={t('password.form.placeholder')}
          icon={KeyRound}
          value={password}
          autoFocus={autoFocus}
          error={fieldError}
          inputClassName="font-mono tracking-[0.02em]"
          onChange={(event) => {
            setPassword(event.target.value)
            if (fieldError) setFieldError(null)
            if (wasCleared) setWasCleared(false)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') clearField()
          }}
          trailing={
            <>
              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={t(visible ? 'password.form.hide' : 'password.form.show')}
                aria-pressed={visible}
                className="flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-rail hover:text-ink"
              >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={clearField}
                aria-label={t('password.form.clear')}
                className="flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-rail hover:text-ink"
              >
                <Eraser className="h-4 w-4" />
              </button>
            </>
          }
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[11.5px] text-faint">
            <span className="h-1 w-1 rounded-full bg-ok" aria-hidden />
            {t('password.form.localOnly')}
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t('password.form.checking')}
              </>
            ) : (
              t('password.form.submit')
            )}
          </Button>
        </div>

        {wasCleared && !pending ? (
          <p className="mt-3 font-mono text-[11px] text-faint">{t('password.form.cleared')}</p>
        ) : null}
      </form>

      <div aria-live="polite">
        {result ? <PasswordResult result={result} tooShort={tooShort} /> : null}
        {failure ? (
          <div className="rounded-2xl border border-warn/25 bg-warn/[0.06] p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
              <div>
                <p className="text-[13.5px] font-medium text-ink">
                  {t('password.result.error.title')}
                </p>
                <p className="mt-1 text-[12.5px] leading-6 text-muted">{t(FAILURE_KEYS[failure])}</p>
                <p className="mt-1.5 text-[11.5px] leading-5 text-faint">
                  {t('password.result.error.body')}
                </p>
              </div>
            </div>
          </div>
        ) : null}
        {!hashingAvailable && !failure ? (
          <div className="rounded-2xl border border-warn/25 bg-warn/[0.06] p-5">
            <div className="flex items-start gap-3">
              <ShieldX className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
              <p className="text-[12.5px] leading-6 text-muted">
                {t('password.error.insecureContext')}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {compact ? null : <KAnonymityExplainer />}
    </div>
  )
}

function PasswordResult({
  result,
  tooShort,
}: {
  result: PasswordCheckResult
  tooShort: boolean
}) {
  const { t, tp, formatNumber } = useI18n()

  if (result.breached) {
    return (
      <div className="overflow-hidden rounded-2xl border border-brand/30 bg-brand/[0.06]">
        <div className="h-px w-full bg-brand/60" aria-hidden />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/35 bg-brand/10">
              <ShieldAlert className="h-5 w-5 text-brand" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold tracking-tight text-ink">
                {t('password.result.pwned.title')}
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-muted">
                {tp('password.result.pwned.body', result.count, {
                  count: formatNumber(result.count),
                })}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-brand/15 pt-4">
            <div>
              <p className="eyebrow">{t('password.result.occurrences')}</p>
              <p className="mt-1 font-mono text-[20px] leading-none text-brand">
                {formatNumber(result.count)}
              </p>
            </div>
            <div>
              <p className="eyebrow">{t('password.result.rangeSizeLabel')}</p>
              <p className="mt-1 font-mono text-[20px] leading-none text-ink">
                {formatNumber(result.rangeSize)}
              </p>
            </div>
          </div>

          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint">
            {t(result.source === 'direct' ? 'password.result.viaDirect' : 'password.result.viaRelay')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ok/25 bg-ok/[0.05]">
      <div className="h-px w-full bg-ok/50" aria-hidden />
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ok/30 bg-ok/10">
            <CheckCircle2 className="h-5 w-5 text-ok" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold tracking-tight text-ink">
              {t('password.result.safe.title')}
            </h3>
            <p className="mt-2 text-[13px] leading-6 text-muted">
              {t('password.result.safe.body', { count: formatNumber(result.rangeSize) })}
            </p>
            {tooShort ? (
              <p className="mt-2 text-[12.5px] leading-5 text-warn">{t('password.error.tooShort')}</p>
            ) : null}
            <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint">
              {t(result.source === 'direct' ? 'password.result.viaDirect' : 'password.result.viaRelay')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const SAMPLE_HASH = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8'

function KAnonymityExplainer() {
  const { t } = useI18n()

  return (
    <section className="rounded-2xl border border-line-soft bg-surface p-5 sm:p-6">
      <h3 className="text-[14px] font-medium text-ink">{t('password.how.title')}</h3>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <ol className="space-y-2.5">
          {(['step1', 'step2', 'step3', 'step4'] as const).map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="mt-0.5 font-mono text-[10.5px] text-faint">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-[12.5px] leading-5 text-muted">{t(`password.how.${step}`)}</span>
            </li>
          ))}
        </ol>

        {/* Diagram of what is sent vs. what stays: concrete, not decorative. */}
        <div className="overflow-hidden rounded-xl border border-line bg-base">
          <div className="border-b border-line-soft px-3.5 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              k-anonymity
            </span>
          </div>
          <div className="space-y-2.5 px-3.5 py-3 font-mono text-[11px] leading-5">
            <div>
              <p className="text-faint">{t('password.diagram.hash')}</p>
              <p className="break-all text-muted">{SAMPLE_HASH}</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="shrink-0 text-[#86EFAC]">
                <span className="text-faint">▸ </span>
                {SAMPLE_HASH.slice(0, 5)}
              </span>
              <span className="text-[10px] uppercase tracking-[0.1em] text-faint">
                {t('password.diagram.sent')}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="shrink-0 break-all text-muted">
                <span className="text-faint">▸ </span>
                {SAMPLE_HASH.slice(5)}
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-faint">
                {t('password.diagram.local')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className={cn('mt-4 text-[12px] leading-5 text-faint')}>{t('password.how.why')}</p>
    </section>
  )
}
