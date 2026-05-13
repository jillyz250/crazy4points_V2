/**
 * Writes an approved CardExtraction to the database.
 *
 *   - Updates credit_cards top-level fields (annual_fee_usd, fx fee, AU fees,
 *     referral, intro)
 *   - Replaces credit_card_earn_rates rows for this card
 *   - Replaces credit_card_benefits rows for this card
 *   - Upserts credit_card_welcome_bonuses with is_current=true
 *   - Flips is_historical_high if the new bonus_amount >= max ever recorded
 *   - Stamps source_url + verified_at on every row
 *   - Updates credit_card_extractions.status='saved'
 *
 * Replace-on-save semantics: re-running extraction wipes prior earn_rates +
 * benefits for the card and writes fresh ones. Welcome bonuses are append
 * (history matters for the record-high alert).
 */

import { createAdminClient } from '@/utils/supabase/server'
import type { CardExtraction } from '@/utils/cards/cardExtractionSchema'

export type SaveResult =
  | { ok: true; benefitsSaved: number; earnRatesSaved: number; welcomeBonusSaved: boolean; newHistoricalHigh: boolean }
  | { ok: false; error: string }

// Must match the CHECK constraint on credit_card_benefits.category in migration 044.
const VALID_CATEGORIES = new Set([
  'statement_credit', 'travel_credit', 'lounge_access', 'insurance',
  'free_night', 'status_conferred', 'protection', 'spend_unlock',
  'portal_redemption', 'transfer_partner_unlock', 'other',
])

/**
 * Coerces a Claude-returned category to a valid enum value. Sonnet sometimes
 * returns display labels ("Credits", "Lounge") instead of enum strings; this
 * maps the most common mistakes back to the canonical value. Anything unknown
 * falls through to 'other' — the catch-all enum value.
 */
function normalizeCategory(raw: string): string {
  const v = raw.toLowerCase().trim().replace(/\s+/g, '_')
  if (VALID_CATEGORIES.has(v)) return v
  // Common display-label drift
  if (v === 'credits' || v === 'credit') return 'statement_credit'
  if (v === 'lounge') return 'lounge_access'
  if (v === 'status') return 'status_conferred'
  if (v === 'travel_perks' || v === 'travel_perk') return 'other'
  return 'other'
}

// Must match the full CHECK constraint on credit_card_benefits.benefit_type
// after migration 257. Update both if a new enum value is added.
const VALID_BENEFIT_TYPES = new Set([
  // Lounge
  'lounge_priority_pass','lounge_centurion','lounge_admirals_club',
  'lounge_skyclub','lounge_united_club','lounge_polaris','lounge_other',
  // Insurance
  'trip_delay_insurance','trip_cancellation_insurance','trip_interruption_insurance',
  'baggage_delay_insurance','lost_luggage_insurance',
  'rental_car_cdw_primary','rental_car_cdw_secondary',
  'travel_accident_insurance','emergency_evacuation_insurance',
  'roadside_assistance','emergency_medical_dental_insurance',
  'travel_emergency_assistance',
  // Credits
  'travel_credit_annual','doordash_credit','dining_credit',
  'streaming_credit','wireless_credit','walmart_credit','saks_credit',
  'global_entry_credit','tsa_precheck_credit','clear_credit',
  'hotel_credit','airline_credit','flight_credit',
  'lyft_credit','uber_credit','equinox_credit','peloton_credit',
  'entertainment_credit',
  // Hotel
  'free_night_award','free_night_after_spend',
  // Status
  'status_hyatt_discoverist','status_hyatt_explorist','status_hyatt_globalist',
  'status_marriott_silver','status_marriott_gold','status_marriott_platinum',
  'status_hilton_silver','status_hilton_gold','status_hilton_diamond',
  'status_hertz_gold','status_avis_preferred','status_national_emerald',
  'status_ihg_silver','status_ihg_gold','status_ihg_platinum','status_ihg_diamond',
  'status_southwest_a_list','status_southwest_a_list_preferred',
  'status_southwest_companion_pass',
  'status_alaska_mvp','status_alaska_mvp_gold','status_alaska_mvp_gold_75k',
  'status_other',
  // Protection
  'purchase_protection','extended_warranty','return_protection','cellphone_protection',
  // Travel perks + catch-alls
  'companion_pass','free_checked_bag','priority_boarding',
  'concierge','prepaid_extra_value',
  'transfer_partner_access','portal_redemption_bonus','spend_unlock_perk',
  'other',
])

// Must match CHECK constraint on credit_card_benefits.frequency after migration 261.
const VALID_FREQUENCIES = new Set([
  'per_trip','per_use','annual','biannual','semiannual','quarterly',
  'monthly','anniversary','one_time','lifetime',
])

/**
 * Coerces a Claude-returned frequency to a valid enum value. Common Sonnet
 * mistakes mapped to the closest valid value; anything unknown falls through
 * to null (frequency is nullable on the column).
 */
function normalizeFrequency(raw: string | null | undefined): string | null {
  if (!raw) return null
  const v = raw.toLowerCase().trim().replace(/[-\s]/g, '_')
  if (VALID_FREQUENCIES.has(v)) return v
  // Common drift
  if (v === 'each_use' || v === 'per_qualifying_use') return 'per_use'
  if (v === 'twice_a_year' || v === 'half_yearly' || v === 'half_year') return 'biannual'
  if (v === 'yearly') return 'annual'
  if (v === 'every_4_years' || v === 'every_four_years') return 'lifetime'  // Global Entry pattern
  return null  // Unknown — drop frequency rather than fail CHECK
}

/**
 * Coerces a Claude-returned benefit_type to a valid enum value. Falls back to
 * 'other' (or a category-appropriate _other variant) if unknown. Keeps the
 * save step from failing on schema drift while the row's `name` and
 * `description` still carry the human-readable benefit name.
 */
function normalizeBenefitType(raw: string, category: string): string {
  const v = raw.toLowerCase().trim().replace(/\s+/g, '_')
  if (VALID_BENEFIT_TYPES.has(v)) return v
  // Pick a category-appropriate fallback so the data stays queryable
  if (category === 'lounge_access') return 'lounge_other'
  if (category === 'status_conferred') return 'status_other'
  return 'other'
}

export async function saveExtractedBenefits({
  cardId,
  extractionId,
  extraction,
  sourceUrl,
}: {
  cardId: string
  extractionId: string
  extraction: CardExtraction
  sourceUrl: string
}): Promise<SaveResult> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // ── 1. Update credit_cards top-level fields ────────────────────────────
  const cardUpdate: Record<string, unknown> = {
    last_verified: now.slice(0, 10), // date
  }
  if (extraction.annual_fee_usd?.value !== null && extraction.annual_fee_usd?.value !== undefined) {
    cardUpdate.annual_fee_usd = extraction.annual_fee_usd.value
  }
  if (extraction.foreign_transaction_fee_pct?.value !== null && extraction.foreign_transaction_fee_pct?.value !== undefined) {
    cardUpdate.foreign_transaction_fee_pct = extraction.foreign_transaction_fee_pct.value
  }
  if (extraction.credit_score_recommended?.value) {
    cardUpdate.credit_score_recommended = extraction.credit_score_recommended.value
  }
  if (extraction.intro?.value) {
    cardUpdate.intro = extraction.intro.value
  }
  if (extraction.referral_bonus_amount?.value !== null && extraction.referral_bonus_amount?.value !== undefined) {
    cardUpdate.referral_bonus_amount = extraction.referral_bonus_amount.value
  }
  if (extraction.referral_bonus_currency?.value) {
    cardUpdate.referral_bonus_currency = extraction.referral_bonus_currency.value
  }
  if (extraction.referral_cap_per_year?.value !== null && extraction.referral_cap_per_year?.value !== undefined) {
    cardUpdate.referral_cap_per_year = extraction.referral_cap_per_year.value
  }
  if (extraction.authorized_user_fee_usd?.value !== null && extraction.authorized_user_fee_usd?.value !== undefined) {
    cardUpdate.authorized_user_fee_usd = extraction.authorized_user_fee_usd.value
  }
  if (extraction.authorized_user_fee_structure?.value) {
    cardUpdate.authorized_user_fee_structure = extraction.authorized_user_fee_structure.value
  }
  if (extraction.authorized_user_bonus_points?.value !== null && extraction.authorized_user_bonus_points?.value !== undefined) {
    cardUpdate.authorized_user_bonus_points = extraction.authorized_user_bonus_points.value
  }

  const { error: cardErr } = await supabase
    .from('credit_cards')
    .update(cardUpdate)
    .eq('id', cardId)
  if (cardErr) return { ok: false, error: `credit_cards update failed: ${cardErr.message}` }

  // ── 2. Replace earn rates ──────────────────────────────────────────────
  await supabase.from('credit_card_earn_rates').delete().eq('card_id', cardId)
  const earnRows = extraction.earn_rates.map((r) => ({
    card_id: cardId,
    category: r.category,
    multiplier: r.multiplier,
    cap_amount_usd: r.cap_amount_usd,
    cap_period: r.cap_period,
    rotating: r.rotating,
    booking_channel: r.booking_channel,
    notes: r.notes,
  }))
  if (earnRows.length > 0) {
    const { error: earnErr } = await supabase.from('credit_card_earn_rates').insert(earnRows)
    if (earnErr) return { ok: false, error: `earn_rates insert failed: ${earnErr.message}` }
  }

  // ── 3. Replace structured benefits ─────────────────────────────────────
  await supabase.from('credit_card_benefits').delete().eq('card_id', cardId)
  const benefitRows = extraction.benefits.map((b, i) => {
    const category = normalizeCategory(b.category)
    return {
    card_id: cardId,
    category,
    benefit_type: normalizeBenefitType(b.benefit_type, category),
    name: b.name,
    value_amount: b.value_amount,
    value_unit: b.value_unit,
    coverage_amount: b.coverage_amount,
    frequency: normalizeFrequency(b.frequency),
    spend_threshold_usd: b.spend_threshold_usd,
    description: b.description,
    metadata: b.metadata ?? {},
    sort_order: i,
    source_url: sourceUrl,
    verified_at: now,
    }
  })
  if (benefitRows.length > 0) {
    const { error: benErr } = await supabase.from('credit_card_benefits').insert(benefitRows)
    if (benErr) return { ok: false, error: `credit_card_benefits insert failed: ${benErr.message}` }
  }

  // ── 4. Welcome bonus: upsert is_current + flip historical_high + elevated ─
  let welcomeBonusSaved = false
  let newHistoricalHigh = false

  const wbMain = extraction.welcome_bonus?.main
  if (wbMain?.bonus_amount && wbMain.bonus_currency && wbMain.spend_required_usd != null && wbMain.spend_window_months) {
    // Demote any existing current offer
    await supabase
      .from('credit_card_welcome_bonuses')
      .update({ is_current: false })
      .eq('card_id', cardId)
      .eq('is_current', true)

    // Check historical high
    const { data: maxRow } = await supabase
      .from('credit_card_welcome_bonuses')
      .select('bonus_amount')
      .eq('card_id', cardId)
      .order('bonus_amount', { ascending: false })
      .limit(1)
      .maybeSingle()

    const previousMax = (maxRow?.bonus_amount as number | undefined) ?? 0
    newHistoricalHigh = wbMain.bonus_amount >= previousMax && previousMax > 0

    // If it ties or beats previous max AND there was a previous max, this is a new high.
    // First-ever offer is NOT marked historical_high (no comparison baseline yet).

    // Baseline + elevated: if Sonnet didn't extract a baseline, default it to
    // the current bonus_amount (no elevation detected). Recompute is_elevated
    // defensively from baseline rather than trusting Sonnet's boolean.
    const baseline = extraction.welcome_bonus.baseline_bonus_amount ?? wbMain.bonus_amount
    const isElevated = wbMain.bonus_amount > baseline

    const { error: wbErr } = await supabase.from('credit_card_welcome_bonuses').insert({
      card_id: cardId,
      bonus_amount: wbMain.bonus_amount,
      bonus_currency: wbMain.bonus_currency,
      spend_required_usd: wbMain.spend_required_usd,
      spend_window_months: wbMain.spend_window_months,
      tiered_bonuses: extraction.welcome_bonus.tiered ?? [],
      extras: extraction.welcome_bonus.extras,
      baseline_bonus_amount: baseline,
      is_elevated: isElevated,
      is_current: true,
      is_historical_high: newHistoricalHigh,
      source_url: sourceUrl,
      verified_at: now,
    })
    if (wbErr) return { ok: false, error: `welcome_bonuses insert failed: ${wbErr.message}` }
    welcomeBonusSaved = true
  }

  // ── 5. Mark extraction row as saved ────────────────────────────────────
  await supabase
    .from('credit_card_extractions')
    .update({ status: 'saved', saved_at: now })
    .eq('id', extractionId)

  return {
    ok: true,
    benefitsSaved: benefitRows.length,
    earnRatesSaved: earnRows.length,
    welcomeBonusSaved,
    newHistoricalHigh,
  }
}
