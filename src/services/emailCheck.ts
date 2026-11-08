import type { EmailCheckResponse } from '@/types'
import { postJson } from './api'

/**
 * Runs an email lookup through our server function.
 *
 * `consent` is part of the contract: the server rejects the request without
 * it, and the UI cannot send an address before the user has ticked the box.
 */
export function checkEmail(email: string, consent: boolean): Promise<EmailCheckResponse> {
  return postJson<EmailCheckResponse>('/api/check-email', { email, consent }, 12_000)
}
