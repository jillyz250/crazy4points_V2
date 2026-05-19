/**
 * Simple Postgres-backed rate limiter.
 *
 * Records each attempt in rate_limit_events and checks how many rows exist
 * for the same key+kind within the lookback window. Way cheaper than
 * adding a KV store, fast enough at our scale.
 *
 * Usage:
 *   const limited = await isRateLimited(supabase, {
 *     key: ipHash,
 *     kind: 'subscribe',
 *     max: 10,
 *     windowMinutes: 60,
 *   })
 *   if (limited) return 429
 *
 * Hash the key before passing in — never store raw IPs. Use ipHashFromRequest()
 * below for the standard case.
 */

import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface RateLimitCheck {
  /** Hashed client identifier — see ipHashFromRequest() for the standard IP form. */
  key: string
  /** Action name. */
  kind: 'subscribe' | 'login' | 'unsubscribe' | string
  /** Max attempts allowed in the window. */
  max: number
  /** Lookback window in minutes. */
  windowMinutes: number
}

/**
 * Returns true if this attempt should be rejected (rate-limit exceeded).
 *
 * Also records the attempt as a side effect — every call to this function
 * counts toward the limit, including the one that rejects. This is correct
 * for the typical pattern of "check, then maybe act."
 */
export async function isRateLimited(
  supabase: SupabaseClient,
  check: RateLimitCheck,
): Promise<boolean> {
  const since = new Date(Date.now() - check.windowMinutes * 60_000).toISOString()

  // Count recent attempts. head:true means we get a count but no rows back.
  const { count, error: countErr } = await supabase
    .from('rate_limit_events')
    .select('*', { count: 'exact', head: true })
    .eq('kind', check.kind)
    .eq('key', check.key)
    .gte('ts', since)

  if (countErr) {
    // Fail open — log + allow. Better than blocking everyone if the table
    // is unavailable for some reason.
    console.error('[rateLimit] count query failed:', countErr.message)
  }

  // Record this attempt regardless of outcome
  const { error: insertErr } = await supabase
    .from('rate_limit_events')
    .insert({ key: check.key, kind: check.kind })
  if (insertErr) {
    console.error('[rateLimit] insert failed:', insertErr.message)
  }

  return (count ?? 0) >= check.max
}

/**
 * Hash a client IP into an opaque key. Pulls IP from the standard Vercel
 * headers (x-forwarded-for, x-real-ip) with a fallback. Returns null if
 * no IP could be determined — caller should fail open in that case.
 */
export function ipHashFromRequest(headers: Headers): string | null {
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    null
  if (!ip) return null
  // Salt with NODE_ENV so dev/prod hashes don't collide. Not a secret —
  // attacker who knows the IP can compute the hash anyway; the hash is
  // about not storing raw IPs in our DB, not about hiding the IP.
  return createHash('sha256').update(ip + '|' + (process.env.NODE_ENV ?? '')).digest('hex').slice(0, 32)
}
