import { useRef } from 'react'
import { AtSign, KeyRound, Mail, Phone, type LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n/fr'
import { cn } from '@/utils/cn'

export type SearchType = 'email' | 'username' | 'phone' | 'password'

export const SEARCH_TYPES: Array<{
  id: SearchType
  icon: LucideIcon
  labelKey: TranslationKey
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  path: string
}> = [
  {
    id: 'email',
    icon: Mail,
    labelKey: 'search.type.email.short',
    titleKey: 'search.type.email.title',
    descriptionKey: 'search.type.email.description',
    path: '/check/email',
  },
  {
    id: 'username',
    icon: AtSign,
    labelKey: 'search.type.username.short',
    titleKey: 'search.type.username.title',
    descriptionKey: 'search.type.username.description',
    path: '/check/username',
  },
  {
    id: 'phone',
    icon: Phone,
    labelKey: 'search.type.phone.short',
    titleKey: 'search.type.phone.title',
    descriptionKey: 'search.type.phone.description',
    path: '/check/phone',
  },
  {
    id: 'password',
    icon: KeyRound,
    labelKey: 'search.type.password.short',
    titleKey: 'search.type.password.title',
    descriptionKey: 'search.type.password.description',
    path: '/check/password',
  },
]

interface SearchTypeSelectorProps {
  value: SearchType
  onChange: (type: SearchType) => void
  idPrefix?: string
}

export function SearchTypeSelector({ value, onChange, idPrefix = 'search' }: SearchTypeSelectorProps) {
  const { t } = useI18n()
  const listRef = useRef<HTMLDivElement>(null)

  /** Roving tabindex: Left/Right move between tabs, as the pattern requires. */
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' &&
        event.key !== 'Home' && event.key !== 'End') {
      return
    }
    event.preventDefault()

    const current = SEARCH_TYPES.findIndex((type) => type.id === value)
    let next = current
    if (event.key === 'ArrowRight') next = (current + 1) % SEARCH_TYPES.length
    if (event.key === 'ArrowLeft') next = (current - 1 + SEARCH_TYPES.length) % SEARCH_TYPES.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = SEARCH_TYPES.length - 1

    onChange(SEARCH_TYPES[next].id)
    const tabs = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    tabs?.[next]?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={t('home.types.title')}
      onKeyDown={handleKeyDown}
      className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"
    >
      {SEARCH_TYPES.map((type) => {
        const active = type.id === value
        const Icon = type.icon
        return (
          <button
            key={type.id}
            id={`${idPrefix}-tab-${type.id}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(type.id)}
            className={cn(
              'group flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-medium transition-colors sm:justify-start',
              active
                ? 'bg-rail text-ink ring-1 ring-inset ring-[#2b3140]'
                : 'text-muted hover:bg-rail/50 hover:text-ink',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                active ? 'text-brand' : 'text-faint group-hover:text-muted',
              )}
              aria-hidden
            />
            <span className="truncate">{t(type.labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}
