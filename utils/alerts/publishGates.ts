/**
 * Gate-check util for the writer-redesign publish flow. Inspects an alert
 * row and reports which of the three publish gates (T&Cs, fact-check, voice)
 * are blocking. Used by publishAlertAction + UI badges.
 *
 * The gates:
 *   - T&Cs:     verified_terms present OR terms_waived_reason present
 *               (only enforced for promo-style alert types; news/devals
 *                are exempt)
 *   - factcheck: zero HIGH-severity unsupported claims
 *   - voice:     voice_pass === true
 *
 * Overrides logged in alert_overrides count as "passed" — the action
 * already happened intentionally and was recorded with a reason.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Alert, AlertType } from '@/utils/supabase/queries'
import { isSupported } from '@/utils/ai/claimStatus'
import type { VerifyClaim } from '@/utils/ai/verifyAlertDraft'
import { summaryContainsScrapeNoise } from '@/utils/intel/sanitizeSummary'

export type GateStatus = 'pass' | 'fail' | 'overridden' | 'not-applicable'

export interface GateReport {
  tnc: GateStatus
  factcheck: GateStatus
  voice: GateStatus
  /** True if every gate is pass / overridden / not-applicable. */
  canPublish: boolean
  /** Human-readable reasons for any failing gate (for UI surface). */
  failures: string[]
}

/** Alert types where T&Cs are required (promo-shaped alerts). */
const TNC_REQUIRED_TYPES: AlertType[] = [
  'transfer_bonus',
  'limited_time_offer',
  'status_promo',
  'award_availability',
  'point_purchase',
]

export async function checkAlertGates(
  supabase: SupabaseClient,
  alert: Pick<
    Alert,
    | 'id'
    | 'type'
    | 'description'
    | 'verified_terms'
    | 'terms_waived_reason'
    | 'voice_pass'
    | 'fact_check_claims'
    | 'summary'
  >
): Promise<GateReport> {
  // Load any prior overrides for this alert — an override means the
  // failing gate was intentionally bypassed and should report as pass.
  const { data: overrides } = await supabase
    .from('alert_overrides')
    .select('gate')
    .eq('alert_id', alert.id)
  const overriddenGates = new Set(
    (overrides ?? []).map((o) => (o as { gate: string }).gate)
  )

  const failures: string[] = []

  // 0) Draft gate — must have a real article body, not just a stub.
  //    Skeleton alerts (a few sentences pasted to test if a topic is worth
  //    pursuing) would otherwise sail through all three downstream gates
  //    because there's "some text." We require ≥ 60 words as a proxy for
  //    "actually written" — any real alert clears that easily.
  const MIN_WORD_COUNT = 60
  const wordCount = (alert.description ?? '').trim().split(/\s+/).filter(Boolean).length
  const hasDraft = wordCount >= MIN_WORD_COUNT
  if (!hasDraft) {
    if (wordCount === 0) {
      failures.push(
        'No draft written yet — paste verified T&Cs below + click Save & Regenerate to write the article.'
      )
    } else {
      failures.push(
        `Draft is only ${wordCount} word${wordCount === 1 ? '' : 's'} — need at least ${MIN_WORD_COUNT} to qualify as a real article. Either flesh it out, or archive if it's a discarded test.`
      )
    }
  }

  // 0.5) Summary noise gate — refuse to publish if the summary still
  //      contains scrape cruft (URLs, markdown links, "back to top").
  //      raw_text from blogs often starts with footer/nav text; this
  //      gate catches the case where the editor didn't rewrite the
  //      placeholder summary before publishing.
  if (summaryContainsScrapeNoise(alert.summary)) {
    failures.push(
      'Summary contains scraped page noise (URL, markdown link, or "back to top"). Rewrite the summary before publishing.'
    )
  }

  // 1) T&C gate
  let tnc: GateStatus
  if (overriddenGates.has('tnc')) {
    tnc = 'overridden'
  } else if (!TNC_REQUIRED_TYPES.includes(alert.type)) {
    tnc = 'not-applicable'
  } else if (
    (alert.verified_terms && alert.verified_terms.trim().length > 0) ||
    (alert.terms_waived_reason && alert.terms_waived_reason.trim().length > 0)
  ) {
    tnc = 'pass'
  } else {
    tnc = 'fail'
    failures.push(
      'Verified T&Cs required for this alert type. Paste official terms or provide a waiver reason.'
    )
  }

  // 2) Fact-check gate — zero HIGH-severity unsupported claims
  let factcheck: GateStatus
  if (overriddenGates.has('factcheck')) {
    factcheck = 'overridden'
  } else {
    const claims: Partial<VerifyClaim>[] = Array.isArray(alert.fact_check_claims)
      ? (alert.fact_check_claims as Partial<VerifyClaim>[])
      : []
    // Match the FactCheckWarnings UI: only count unresolved unsupported claims.
    // An admin who's clicked "Mark verified" on a chip has reviewed it; the
    // gate shouldn't keep blocking on that same claim.
    const highUnsupported = claims.filter(
      (c) =>
        c &&
        typeof c === 'object' &&
        c.severity === 'high' &&
        !isSupported(c) &&
        c.acknowledged !== true
    )
    if (highUnsupported.length === 0) {
      factcheck = 'pass'
    } else {
      factcheck = 'fail'
      failures.push(
        `${highUnsupported.length} high-severity unsupported claim(s) — resolve, strip, or override.`
      )
    }
  }

  // 3) Voice gate
  let voice: GateStatus
  if (overriddenGates.has('voice')) {
    voice = 'overridden'
  } else if (alert.voice_pass === true) {
    voice = 'pass'
  } else if (alert.voice_pass === null) {
    // Never checked. Treat as not-applicable so legacy alerts published
    // before the gate existed are unaffected. New writes always set this.
    voice = 'not-applicable'
  } else {
    voice = 'fail'
    failures.push('Voice gate failed. Regenerate or override with a reason.')
  }

  const passOrSkip = (g: GateStatus): boolean =>
    g === 'pass' || g === 'overridden' || g === 'not-applicable'
  // canPublish requires an actual draft + all three gates to pass-or-skip.
  // The draft gate can't be overridden — publishing nothing is never valid.
  const canPublish = hasDraft && passOrSkip(tnc) && passOrSkip(factcheck) && passOrSkip(voice)

  return { tnc, factcheck, voice, canPublish, failures }
}
