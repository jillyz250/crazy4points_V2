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
