import type { CheckResponse } from '@/types'
import { postJson } from './api'

/**
 * Runs an email lookup through our server function.
 *
 * `consent` is part of the contract: the server rejects the request without
 * it, and the UI cannot send an address before the user has ticked the box.
 */
export function checkEmail(email: string, consent: boolean): Promise<CheckResponse> {
  return postJson<CheckResponse>('/api/check-email', { email, consent }, 12_000)
}

/**
 * Runs a username lookup.
 *
 * Only providers that really support username search are queried server-side
 * (currently LeakCheck's free public API); the response states which ones
 * answered, exactly like the email flow.
 */
export function checkUsername(username: string, consent: boolean): Promise<CheckResponse> {
  return postJson<CheckResponse>('/api/check-username', { username, consent }, 12_000)
}

/**
 * Runs a phone number lookup.
 *
 * The number reaches this function already normalised to E.164 by
 * libphonenumber (`+33612345678`). The server strips the `+` before calling the
 * provider, which only understands bare digits, and the response reports the
 * single source's answer exactly like the other kinds.
 */
export function checkPhone(phone: string, consent: boolean): Promise<CheckResponse> {
  return postJson<CheckResponse>('/api/check-phone', { phone, consent }, 12_000)
}
