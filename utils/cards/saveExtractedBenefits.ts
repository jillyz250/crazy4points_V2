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
  const benefitRows = extraction.benefits.map((b, i) => ({
    card_id: cardId,
    category: b.category,
    benefit_type: b.benefit_type,
    name: b.name,
    value_amount: b.value_amount,
    value_unit: b.value_unit,
    coverage_amount: b.coverage_amount,
    frequency: b.frequency,
    spend_threshold_usd: b.spend_threshold_usd,
    description: b.description,
    metadata: b.metadata ?? {},
    sort_order: i,
    source_url: sourceUrl,
    verified_at: now,
  }))
  if (benefitRows.length > 0) {
    const { error: benErr } = await supabase.from('credit_card_benefits').insert(benefitRows)
    if (benErr) return { ok: false, error: `credit_card_benefits insert failed: ${benErr.message}` }
  }

  // ── 4. Welcome bonus: upsert is_current + flip historical_high ─────────
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

    const { error: wbErr } = await supabase.from('credit_card_welcome_bonuses').insert({
      card_id: cardId,
      bonus_amount: wbMain.bonus_amount,
      bonus_currency: wbMain.bonus_currency,
      spend_required_usd: wbMain.spend_required_usd,
      spend_window_months: wbMain.spend_window_months,
      tiered_bonuses: extraction.welcome_bonus.tiered ?? [],
      extras: extraction.welcome_bonus.extras,
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
