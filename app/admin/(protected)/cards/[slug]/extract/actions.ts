'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { extractCardBenefits } from '@/utils/cards/extractCardBenefits'
import { saveExtractedBenefits } from '@/utils/cards/saveExtractedBenefits'
import type { CardExtraction } from '@/utils/cards/cardExtractionSchema'

/**
 * The one-shot "run extraction" action used by auto-approve mode.
 * Firecrawl + Claude + write to DB in a single round-trip.
 *
 * Returns a result the page can render directly.
 */
export async function runExtractionAndSave(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const sourceUrl = String(formData.get('source_url') ?? '').trim()
  const interactive = formData.get('interactive') === 'on'

  if (!slug || !sourceUrl) {
    console.error('[card-extract] missing slug or source_url')
    return
  }

  const supabase = createAdminClient()
  const { data: card, error } = await supabase
    .from('credit_cards')
    .select('id, name, official_url')
    .eq('slug', slug)
    .single()

  if (error || !card) {
    console.error(`[card-extract] card not found: ${slug}`)
    return
  }

  // Persist the URL on the card row the first time the editor types one in
  // (or whenever they switch to a different source URL). Means the editor
  // never has to copy/paste it again — pre-fills on every future extraction.
  if (sourceUrl !== card.official_url) {
    await supabase
      .from('credit_cards')
      .update({ official_url: sourceUrl })
      .eq('id', card.id)
  }

  // 1. Extract
  const extractionResult = await extractCardBenefits({
    cardId: card.id,
    cardName: card.name,
    sourceUrl,
    interactive,
  })

  if (!extractionResult.ok) {
    console.error(`[card-extract] extraction failed: ${extractionResult.error}`)
    // Still revalidate so the failure row appears in the audit log on next render.
    revalidatePath(`/admin/cards/${slug}/extract`)
    return
  }

  // 2. Auto-approve: save immediately
  const saveResult = await saveExtractedBenefits({
    cardId: card.id,
    extractionId: extractionResult.extractionId,
    extraction: extractionResult.extraction,
    sourceUrl,
  })

  if (!saveResult.ok) {
    console.error(`[card-extract] save failed: ${saveResult.error}`)
    // Surface the error to the editor by marking the extraction failed.
    // Without this the row stays 'extracted' even though no data landed in
    // credit_card_benefits / earn_rates / welcome_bonuses — silent failure.
    await supabase
      .from('credit_card_extractions')
      .update({
        status: 'failed',
        error_message: `Save failed after extraction: ${saveResult.error}`,
      })
      .eq('id', extractionResult.extractionId)
  } else {
    console.log(`[card-extract] saved card=${slug} benefits=${saveResult.benefitsSaved} earn=${saveResult.earnRatesSaved} wb=${saveResult.welcomeBonusSaved} historical_high=${saveResult.newHistoricalHigh}`)
  }

  // 3. Revalidate the card's public page so the new data renders
  revalidatePath(`/cards/${slug}`)
  revalidatePath(`/admin/cards/${slug}/extract`)
}

/**
 * Re-save a previously cached extraction WITHOUT re-running Firecrawl/Claude.
 * Useful when the editor edited the extraction JSON manually and wants to
 * re-persist, or when the save step failed and we want to retry.
 */
export async function resaveExtraction(formData: FormData): Promise<void> {
  const extractionId = String(formData.get('extraction_id') ?? '').trim()
  if (!extractionId) return

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('credit_card_extractions')
    .select('id, card_id, source_url, extraction, credit_cards!inner(slug)')
    .eq('id', extractionId)
    .single()

  if (error || !data) {
    console.error('[card-extract] resave: extraction row not found')
    return
  }

  const result = await saveExtractedBenefits({
    cardId: data.card_id,
    extractionId: data.id,
    extraction: data.extraction as CardExtraction,
    sourceUrl: data.source_url,
  })

  if (!result.ok) {
    console.error(`[card-extract] resave failed: ${result.error}`)
    await supabase
      .from('credit_card_extractions')
      .update({
        status: 'failed',
        error_message: `Re-save failed: ${result.error}`,
      })
      .eq('id', extractionId)
  } else {
    await supabase
      .from('credit_card_extractions')
      .update({ status: 'saved', saved_at: new Date().toISOString() })
      .eq('id', extractionId)
  }

  const slug = (data as unknown as { credit_cards: { slug: string } }).credit_cards?.slug
  if (slug) {
    revalidatePath(`/cards/${slug}`)
    revalidatePath(`/admin/cards/${slug}/extract`)
  }
}

/**
 * Mark an extraction as rejected (will not be applied to the card).
 */
export async function rejectExtraction(formData: FormData): Promise<void> {
  const extractionId = String(formData.get('extraction_id') ?? '').trim()
  if (!extractionId) return

  const supabase = createAdminClient()
  await supabase
    .from('credit_card_extractions')
    .update({ status: 'rejected' })
    .eq('id', extractionId)
}

/**
 * Manual welcome bonus entry — used when extraction returns null bonus_amount
 * (issuer page hides the points behind the apply flow, common with Citi).
 *
 * Editor fills the inline form on the extract page. We save the manual entry
 * to credit_card_welcome_bonuses (same shape as extracted welcome bonuses)
 * and stamp metadata so future audits know it was editorial entry.
 */
export async function saveManualWelcomeBonus(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const bonusAmount = parseInt(String(formData.get('bonus_amount') ?? ''), 10)
  const bonusCurrency = String(formData.get('bonus_currency') ?? '').trim()
  const spendRequired = parseInt(String(formData.get('spend_required_usd') ?? ''), 10)
  const spendWindowMonths = parseInt(String(formData.get('spend_window_months') ?? ''), 10)
  const baselineRaw = String(formData.get('baseline_bonus_amount') ?? '').trim()
  const baseline = baselineRaw ? parseInt(baselineRaw, 10) : null
  const sourceUrl = String(formData.get('source_url') ?? '').trim()
  const notes = String(formData.get('notes') ?? '').trim() || null

  if (!slug || !Number.isFinite(bonusAmount) || !bonusCurrency || !Number.isFinite(spendRequired) || !Number.isFinite(spendWindowMonths)) {
    console.error('[card-extract] manual welcome bonus — missing required fields')
    return
  }

  const supabase = createAdminClient()
  const { data: card } = await supabase.from('credit_cards').select('id').eq('slug', slug).single()
  if (!card) {
    console.error(`[card-extract] manual welcome bonus — card not found: ${slug}`)
    return
  }

  // Demote any current offer
  await supabase
    .from('credit_card_welcome_bonuses')
    .update({ is_current: false })
    .eq('card_id', card.id)
    .eq('is_current', true)

  // Determine elevation vs. baseline
  const effectiveBaseline = baseline ?? bonusAmount
  const isElevated = bonusAmount > effectiveBaseline

  // Historical-high check
  const { data: maxRow } = await supabase
    .from('credit_card_welcome_bonuses')
    .select('bonus_amount')
    .eq('card_id', card.id)
    .order('bonus_amount', { ascending: false })
    .limit(1)
    .maybeSingle()
  const previousMax = (maxRow?.bonus_amount as number | undefined) ?? 0
  const isHistoricalHigh = bonusAmount >= previousMax && previousMax > 0

  const now = new Date().toISOString()
  await supabase.from('credit_card_welcome_bonuses').insert({
    card_id: card.id,
    bonus_amount: bonusAmount,
    bonus_currency: bonusCurrency,
    spend_required_usd: spendRequired,
    spend_window_months: spendWindowMonths,
    baseline_bonus_amount: effectiveBaseline,
    is_elevated: isElevated,
    is_current: true,
    is_historical_high: isHistoricalHigh,
    tiered_bonuses: [],
    extras: notes,
    source_url: sourceUrl || null,
    verified_at: now,
  })

  revalidatePath(`/cards/${slug}`)
  revalidatePath(`/admin/cards/${slug}/extract`)
}
