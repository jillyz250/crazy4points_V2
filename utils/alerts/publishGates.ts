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
import { needsFinancialDisclosure } from '@/lib/alerts/legalDisclosure'

export type GateStatus = 'pass' | 'fail' | 'overridden' | 'not-applicable'

export interface GateReport {
  tnc: GateStatus
  factcheck: GateStatus
  voice: GateStatus
  source: GateStatus
  /**
   * Legal-disclosure gate. Financial-product alerts (bank/card/deposit
   * bonuses, point_purchase) and any alert with an outbound offer_url must
   * carry a not-affiliated / not-advice disclosure (Charlie's gate). 'pass'
   * when a disclosure will render, 'not-applicable' for non-financial alerts.
   */
  legal: GateStatus
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

/**
 * Alert types that assert an ongoing, changeable program STATE — "X is now a
 * partner", "Y is now bookable", "the earn rate changed to Z". These go stale
 * silently when the program later reverses course (exactly how the Philippine
 * Airlines / Alaska Atmos alert went wrong: sourced from a blog article that
 * predated the redemption being pulled). We require an OFFICIAL source or
 * verified T&Cs before publishing one, so a stale-blog claim can't sail
 * through on a secondary link alone.
 */
const STATE_CLAIM_TYPES: AlertType[] = [
  'award_availability',
  'program_change',
  'partner_change',
  'category_change',
  'earn_rate_change',
  'status_change',
  'policy_change',
  'sweet_spot',
]

/**
 * Known points/miles blogs and aggregators. A source_url on one of these is
 * NOT an official confirmation of a program's current state — reporting can be
 * stale or later reversed. Not a blocklist of bad actors (these are good
 * sources); just "not authoritative for a live-state claim on its own."
 */
const BLOG_DOMAINS = [
  'frequentmiler', 'awardwallet', 'thepointsguy', 'upgradedpoints', 'loyaltylobby',
  'princeoftravel', 'onemileatatime', 'viewfromthewing', 'doctorofcredit',
  'milestomemories', 'travelcodex', 'headforpoints', 'godsavethepoints',
  'reddit', 'flyertalk', 'facebook', 'youtube', 'x.com', 'twitter', 'medium',
]

function isBlogSource(url: string | null | undefined): boolean {
  if (!url) return false
  const lc = url.toLowerCase()
  return BLOG_DOMAINS.some((d) => lc.includes(d))
}

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
    | 'source_url'
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

  // 4) Source gate — a live-STATE claim needs an official source, not just a
  //    blog. Passes when verified T&Cs are present (already sourced) or the
  //    source_url is not a known secondary blog/aggregator. Fails when a
  //    state-claim alert has no source at all, or only a blog link.
  let source: GateStatus
  if (overriddenGates.has('source')) {
    source = 'overridden'
  } else if (!STATE_CLAIM_TYPES.includes(alert.type)) {
    source = 'not-applicable'
  } else if (alert.verified_terms && alert.verified_terms.trim().length > 0) {
    source = 'pass'
  } else if (alert.source_url && alert.source_url.trim().length > 0 && !isBlogSource(alert.source_url)) {
    source = 'pass'
  } else {
    source = 'fail'
    const why = !alert.source_url
      ? 'no source is attached'
      : 'the only source is a secondary blog/aggregator'
    failures.push(
      `This alert asserts a program state (partner/redemption/rate) but ${why}. ` +
        `Add an official issuer/program source or paste verified T&Cs, or override with a reason. ` +
        `(Stops stale-blog claims like the Alaska/Philippine Airlines redemption.)`
    )
  }

  // 5) Legal-disclosure gate (Charlie, 2026-09-05). Financial-product alerts
  //    and any alert with an outbound offer_url MUST carry a not-affiliated /
  //    not-advice disclosure. offer_url + legal_disclosure live in variant
  //    metadata (not on the alerts mirror), so we read them from the backing
  //    content_variant. Passes when a custom legal_disclosure is attached;
  //    fails (with an override path) when an applicable alert has none.
  let legal: GateStatus
  if (overriddenGates.has('legal')) {
    legal = 'overridden'
  } else {
    let offerUrl: string | null = null
    let legalDisclosure: string | null = null
    try {
      const { data: topicRow } = await supabase
        .from('topics')
        .select('id')
        .contains('metadata', { original_alert_id: alert.id })
        .maybeSingle()
      if (topicRow?.id) {
        const { data: variant } = await supabase
          .from('content_variants')
          .select('metadata')
          .eq('topic_id', topicRow.id)
          .eq('format', 'alert')
          .maybeSingle()
        const vm = (variant?.metadata ?? {}) as Record<string, unknown>
        offerUrl = typeof vm.offer_url === 'string' ? vm.offer_url : null
        legalDisclosure = typeof vm.legal_disclosure === 'string' ? vm.legal_disclosure : null
      }
    } catch {
      /* non-fatal: fall through to type-based applicability */
    }
    if (!needsFinancialDisclosure(alert.type, offerUrl)) {
      legal = 'not-applicable'
    } else if (legalDisclosure && legalDisclosure.trim().length > 0) {
      legal = 'pass'
    } else {
      legal = 'fail'
      failures.push(
        'Financial or offer alert needs a legal disclosure (not affiliated / not financial ' +
          'advice / not a recommendation). Route to Charlie, attach the reviewed disclosure text, ' +
          'or override with a reason.',
      )
    }
  }

  const passOrSkip = (g: GateStatus): boolean =>
    g === 'pass' || g === 'overridden' || g === 'not-applicable'
  // canPublish requires an actual draft + all gates to pass-or-skip.
  // The draft gate can't be overridden — publishing nothing is never valid.
  const canPublish =
    hasDraft &&
    passOrSkip(tnc) &&
    passOrSkip(factcheck) &&
    passOrSkip(voice) &&
    passOrSkip(source) &&
    passOrSkip(legal)

  return { tnc, factcheck, voice, source, legal, canPublish, failures }
}
