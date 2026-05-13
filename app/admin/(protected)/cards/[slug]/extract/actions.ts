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
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (error || !card) {
    console.error(`[card-extract] card not found: ${slug}`)
    return
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
