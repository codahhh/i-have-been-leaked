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
