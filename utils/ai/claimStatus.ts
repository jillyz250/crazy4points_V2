/**
 * Helpers for the three-state truth model on VerifyClaim.supported.
 *
 *   true          → source EXPLICITLY confirms the claim
 *   false         → source EXPLICITLY contradicts the claim
 *   'unsupported' → source is silent / can't verify from T1
 *
 * Usage rule of thumb across the admin code:
 *   - "Did the source confirm this?"           → isSupported(c)
 *   - "Did the source contradict this?"        → isContradicted(c)
 *   - "Is this in the gray middle?"            → isUnsupported(c)
 *   - "Is this NOT positively confirmed?"      → isNotConfirmed(c)
 *     (Old `!c.supported` semantics — true for both `false` and
 *      `'unsupported'`. Use this when migrating boolean checks
 *      that should preserve old behavior.)
 *
 * The helpers all accept a partial shape so they work cleanly against
 * legacy fact_check_claims rows persisted before the type change (where
 * `supported` may be missing entirely on very old data).
 */

export type ClaimSupportState = boolean | 'unsupported'

interface ClaimLike {
  supported?: ClaimSupportState
}

/** Source explicitly confirmed the claim. */
export function isSupported(c: ClaimLike): boolean {
  return c.supported === true
}

/** Source explicitly contradicted the claim — this is a real factual error. */
export function isContradicted(c: ClaimLike): boolean {
  return c.supported === false
}

/**
 * Source was silent — we can't verify from T1. Treated as a yellow flag
 * for editor review (might be legit new info our pages don't have yet),
 * not a red factual error. Web verification on these is optional and
 * unreliable for negative claims.
 */
export function isUnsupported(c: ClaimLike): boolean {
  return c.supported === 'unsupported'
}

/**
 * Preserves legacy `!c.supported` semantics — true for both `false`
 * (contradicted) and `'unsupported'` (silent). Useful when migrating
 * existing boolean checks where the distinction doesn't matter yet.
 */
export function isNotConfirmed(c: ClaimLike): boolean {
  return c.supported !== true
}
