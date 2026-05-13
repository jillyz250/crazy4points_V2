import type { PromoReward, IntelType } from '@/utils/supabase/promoQueries'

/**
 * Enrichment pipeline — Phase 1 (naive) implementation.
 *
 * Computes the intel_* fields on a freshly-scraped promo_rewards row
 * before it lands in the admin queue. Phase 6 will replace this with
 * full route matching + value scoring against the partner_redemptions
 * table; for now the goal is "enough signal for the curator to
 * triage by score."
 *
 * Pure functions. No DB access — caller passes any required context.
 */

/** Input shape — the scraper's parsed output before enrichment. */
export interface PreEnrichmentRow {
  promo_label: string | null
  origin_iata: string | null
  dest_iata: string | null
  origin_label: string | null
  dest_label: string | null
  cabin: string | null
  carrier_slug: string | null
  points_required: number | null
  points_baseline: number | null
  cash_co_pay_amount: number | null
  cash_co_pay_currency: string | null
  valid_from: string | null
  valid_to: string | null
  booking_window_end: string | null
  raw_payload: Record<string, unknown> | null
  /** Default intel_type from the scraper config — gets refined here when signals warrant. */
  default_intel_type: IntelType
}

/** Output shape — enriched fields ready to merge into the persist payload. */
export interface EnrichedFields {
  intel_type: IntelType
  intel_discount_percent: number | null
  intel_value_score: number | null
  intel_inferred_baseline: number | null
  intel_affects_redemption_ids: string[] | null
  intel_affects_alert_ids: string[] | null
  intel_match_confidence: 'high' | 'medium' | 'low' | 'unmatched'
}

export function enrichPromoRow(row: PreEnrichmentRow): EnrichedFields {
  const intel_type = classifyType(row)

  // Read scraper-extracted discount % from raw_payload if present.
  const displayedDiscount = readDisplayedDiscount(row.raw_payload)
  const intel_discount_percent =
    displayedDiscount ?? computeDiscountPercent(row)

  // Back-calculate baseline when we have an actual promo cost + a
  // discount % but no explicit baseline. This is the chart-derivation
  // foundation (plans/promo-scraper.md Phase 7).
  const intel_inferred_baseline = computeInferredBaseline(
    row.points_required,
    intel_discount_percent,
    row.points_baseline,
  )

  const intel_value_score = computeValueScore({ ...row, intel_discount_percent })

  // Phase 1: no route matching yet. Phase 6 fills these.
  return {
    intel_type,
    intel_discount_percent,
    intel_value_score,
    intel_inferred_baseline,
    intel_affects_redemption_ids: null,
    intel_affects_alert_ids: null,
    intel_match_confidence: 'unmatched',
  }
}

/** Read the displayed discount % from the scraper's raw payload, if any. */
function readDisplayedDiscount(
  payload: Record<string, unknown> | null,
): number | null {
  if (!payload) return null
  const candidates = [
    'discount_percent_displayed',
    'discount_percent',
    'discount',
  ]
  for (const key of candidates) {
    const v = payload[key]
    if (typeof v === 'number' && v > 0 && v < 100) return v
    if (typeof v === 'string') {
      const n = parseFloat(v.replace('%', '').trim())
      if (!isNaN(n) && n > 0 && n < 100) return n
    }
  }
  return null
}

/** Back-calculate the baseline points cost from promo + discount %. */
function computeInferredBaseline(
  pointsRequired: number | null,
  discountPercent: number | null,
  explicitBaseline: number | null,
): number | null {
  // When we already have an explicit baseline, no need to infer.
  if (explicitBaseline != null) return null
  if (!pointsRequired || !discountPercent) return null
  if (discountPercent <= 0 || discountPercent >= 100) return null
  const baseline = pointsRequired / (1 - discountPercent / 100)
  return Math.round(baseline)
}

/**
 * Phase 1 type classification: trust the scraper's default unless a
 * label keyword warrants reclassification.
 *
 * Examples:
 *   "Transfer 25% bonus to Avianca" → transfer_bonus
 *   "Spontaneous Escape: BKK"       → flash_sale
 *   "Award chart updated"           → chart_change
 */
function classifyType(row: PreEnrichmentRow): IntelType {
  const label = (row.promo_label ?? '').toLowerCase()

  if (/transfer\s*(bonus|promotion)|\d+%\s*bonus.*transfer/.test(label)) {
    return 'transfer_bonus'
  }
  if (/spontaneous|flash|today only|24\s*hour/.test(label)) {
    return 'flash_sale'
  }
  if (/award sale|miles? sale/.test(label)) {
    return 'award_sale'
  }
  if (/status (match|challenge|fast.?track|promotion)/.test(label)) {
    return 'status_fast_track'
  }
  if (/chart (update|change|new)/.test(label)) {
    return 'chart_change'
  }

  return row.default_intel_type
}

/**
 * Discount % vs baseline. If the scraper extracted a baseline (e.g.
 * "Normal price: 25,000 miles") use that. Otherwise no signal.
 */
function computeDiscountPercent(row: PreEnrichmentRow): number | null {
  if (!row.points_required || !row.points_baseline) return null
  if (row.points_baseline <= 0) return null
  const pct = ((row.points_baseline - row.points_required) / row.points_baseline) * 100
  if (pct <= 0) return null
  return Math.round(pct * 10) / 10
}

/**
 * Phase 1 value score: naive sum of signals, clamped 0-100.
 *
 *   discount % weight: 1.0
 *   premium cabin bonus: +15 for Business, +25 for First
 *   long-haul cue: +10 if "intercontinental" / "long-haul" / specific region words in label
 *
 * Phase 6 will replace this with proper region/carrier weights and
 * historical-average comparison.
 */
function computeValueScore(
  row: PreEnrichmentRow & { intel_discount_percent: number | null },
): number | null {
  let score = 0
  let hasSignal = false

  if (row.intel_discount_percent != null) {
    score += row.intel_discount_percent
    hasSignal = true
  }

  const cabin = (row.cabin ?? '').toLowerCase()
  if (cabin === 'business' || cabin === 'j') {
    score += 15
    hasSignal = true
  } else if (cabin === 'first' || cabin === 'f') {
    score += 25
    hasSignal = true
  }

  const label = (row.promo_label ?? '').toLowerCase()
  const dest = (row.dest_label ?? '').toLowerCase()
  if (
    /intercontinental|long.?haul|asia|europe|africa|south america|oceania|pacific/.test(
      `${label} ${dest}`,
    )
  ) {
    score += 10
    hasSignal = true
  }

  if (!hasSignal) return null
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10))
}
