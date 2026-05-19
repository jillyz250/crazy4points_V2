/**
 * Signed unsubscribe tokens — HMAC of the subscriber's email.
 *
 * Why: /api/unsubscribe?email=X is a public GET; without a signature anyone
 * who knows (or guesses) a subscriber's email can unsubscribe them. A bot
 * scraping email lists could mass-unsubscribe people from your list before
 * you even notice.
 *
 * How: every unsubscribe link we send includes a token = HMAC-SHA256(email,
 * UNSUBSCRIBE_SECRET). The handler recomputes the HMAC and compares in
 * constant time. No DB column needed — the token is deterministic from the
 * email + the secret.
 *
 * Rotation: if you suspect the secret leaked, rotate UNSUBSCRIBE_SECRET on
 * Vercel. Existing links in already-sent emails stop working, which is
 * exactly the safety property you want.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

const TOKEN_BYTES = 16 // 32 hex chars — plenty of entropy for our threat model

function getSecret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET
  if (!s || s.length < 16) {
    // Fall back to CRON_SECRET if UNSUBSCRIBE_SECRET is unset so the system
    // doesn't break before the env var is configured. Loud warning logged
    // so the gap is visible in production logs.
    const fallback = process.env.CRON_SECRET
    if (!fallback) {
      throw new Error('Neither UNSUBSCRIBE_SECRET nor CRON_SECRET is set — cannot sign unsubscribe links')
    }
    console.warn('[unsubscribe] UNSUBSCRIBE_SECRET not set; falling back to CRON_SECRET (rotate before relying on it long-term)')
    return fallback
  }
  return s
}

/**
 * Generate a signed token for an email address. Deterministic.
 */
export function signUnsubscribeToken(email: string): string {
  const normalized = email.toLowerCase().trim()
  const hmac = createHmac('sha256', getSecret())
  hmac.update(normalized)
  return hmac.digest('hex').slice(0, TOKEN_BYTES * 2)
}

/**
 * Verify a token against an email. Constant-time comparison to avoid
 * timing attacks (theoretically: a remote attacker measuring response time
 * could brute-force the token byte-by-byte without constant-time compare).
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false
  const expected = signUnsubscribeToken(email)
  if (expected.length !== token.length) return false
  try {
    return timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(token, 'utf8'),
    )
  } catch {
    return false
  }
}

/**
 * Build the full one-click unsubscribe URL for an email. Used in welcome
 * emails + newsletter footer + every transactional email going forward.
 */
export function unsubscribeUrlFor(email: string, origin = 'https://www.crazy4points.com'): string {
  const token = signUnsubscribeToken(email)
  return `${origin}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}
