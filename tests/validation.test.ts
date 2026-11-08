import { describe, expect, it } from 'vitest'
import {
  isValidEmail,
  isValidSha1Prefix,
  isValidUsername,
  normalizeEmail,
} from '@/utils/validation'

describe('isValidEmail', () => {
  it.each([
    'you@example.com',
    'first.last@sub.example.co.uk',
    'user+tag@example.io',
    "o'brien@example.com",
    'a@b.co',
  ])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true)
  })

  it.each([
    ['', 'empty'],
    ['plainaddress', 'no @'],
    ['@example.com', 'no local part'],
    ['user@', 'no domain'],
    ['user@localhost', 'no dot in domain'],
    ['user@@example.com', 'double @'],
    ['user name@example.com', 'space'],
    ['user@exa mple.com', 'space in domain'],
    ['user@example..com', 'consecutive dots'],
    ['user@-example.com', 'leading hyphen'],
    ['user@example.c', 'one-letter tld'],
    ['user@example.123', 'numeric tld'],
    ['.user@example.com', 'leading dot in local part'],
  ])('rejects %s (%s)', (email) => {
    expect(isValidEmail(email)).toBe(false)
  })

  it('rejects addresses longer than 254 characters', () => {
    const local = 'a'.repeat(64)
    const domain = `${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.com`
    expect(isValidEmail(`${local}@${domain}`)).toBe(false)
  })

  it('tolerates surrounding whitespace but rejects embedded control characters', () => {
    expect(isValidEmail('  you@example.com  ')).toBe(true)
    expect(isValidEmail('you@exa\nmple.com')).toBe(false)
    expect(isValidEmail('you@example.com\u0000')).toBe(false)
  })
})

describe('normalizeEmail', () => {
  it('trims and lowercases for comparison only', () => {
    expect(normalizeEmail('  You@Example.COM ')).toBe('you@example.com')
  })
})

describe('isValidUsername', () => {
  it('accepts 3–64 characters of [A-Za-z0-9._-]', () => {
    expect(isValidUsername('abc')).toBe(true)
    expect(isValidUsername('john.doe_99-x')).toBe(true)
  })

  it('rejects too short, too long or exotic input', () => {
    expect(isValidUsername('ab')).toBe(false)
    expect(isValidUsername('a'.repeat(65))).toBe(false)
    expect(isValidUsername('john doe')).toBe(false)
    expect(isValidUsername('john@doe')).toBe(false)
  })
})

describe('isValidSha1Prefix', () => {
  it('accepts exactly five hex characters', () => {
    expect(isValidSha1Prefix('21BD1')).toBe(true)
    expect(isValidSha1Prefix('abcde')).toBe(true)
  })

  it('rejects everything else', () => {
    expect(isValidSha1Prefix('21BD')).toBe(false)
    expect(isValidSha1Prefix('21BD12')).toBe(false)
    expect(isValidSha1Prefix('ZZZZZ')).toBe(false)
    expect(isValidSha1Prefix('')).toBe(false)
  })
})
