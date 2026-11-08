import {
  AtSign,
  CalendarDays,
  CreditCard,
  FileText,
  Fingerprint,
  Globe,
  HardDrive,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Share2,
  User,
  type LucideIcon,
} from 'lucide-react'
import type { TranslationKey } from '@/i18n/fr'

export interface ExposedCategory {
  /** Translation key, when we recognise the category. */
  key: TranslationKey | null
  icon: LucideIcon
  /** Raw label from the provider (always shown as a fallback / tooltip). */
  raw: string
}

/**
 * Ordered matchers — the most specific patterns first so that
 * "Username" does not get swallowed by the generic name matcher.
 */
const MATCHERS: Array<{ pattern: RegExp; key: TranslationKey; icon: LucideIcon }> = [
  { pattern: /username|login|screen ?name|handle/i, key: 'exposed.username', icon: AtSign },
  { pattern: /e-?mail/i, key: 'exposed.email', icon: Mail },
  { pattern: /password|passphrase|credential|hash/i, key: 'exposed.password', icon: KeyRound },
  { pattern: /phone|mobile|telephone/i, key: 'exposed.phone', icon: Phone },
  { pattern: /\bip\b|ip address/i, key: 'exposed.ip', icon: Globe },
  { pattern: /date of birth|birth|dob|\bage\b/i, key: 'exposed.dob', icon: CalendarDays },
  {
    pattern: /credit|bank|card|iban|payment|salary|financial|billing/i,
    key: 'exposed.financial',
    icon: CreditCard,
  },
  { pattern: /passport|national id|ssn|social security|licen[cs]e|identity/i, key: 'exposed.identity', icon: Fingerprint },
  { pattern: /address|postal|street|zip|city/i, key: 'exposed.address', icon: MapPin },
  { pattern: /social|twitter|facebook|linkedin|profile/i, key: 'exposed.social', icon: Share2 },
  { pattern: /device|imei|mac address|browser|user agent/i, key: 'exposed.device', icon: HardDrive },
  { pattern: /location|geo|gps|latitude|coordinates/i, key: 'exposed.location', icon: MapPin },
  { pattern: /\bname\b|full name|first name|last name/i, key: 'exposed.name', icon: User },
  { pattern: /document|note|message|content|text/i, key: 'exposed.other', icon: FileText },
]

export function classifyExposedData(raw: string): ExposedCategory {
  const trimmed = raw.trim()
  for (const matcher of MATCHERS) {
    if (matcher.pattern.test(trimmed)) {
      return { key: matcher.key, icon: matcher.icon, raw: trimmed }
    }
  }
  return { key: null, icon: FileText, raw: trimmed }
}
