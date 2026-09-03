'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { flagGoodToKnowReviewIfStale, clearGoodToKnowReview } from '@/utils/cards/goodToKnowReviewFlag'

/**
 * The welcome-bonus monitor is detection-only: it flags cards whose live sign-up
 * bonus differs from our stored value. The editor reviews, then either applies
 * the detected value (one click) or dismisses the signal.
 */

export async function applySignal(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()

  const { data: sig } = await supabase
    .from('card_bonus_signals')
    .select('card_id, detected_amount, detected_spend')
    .eq('id', id)
    .maybeSingle()
  if (!sig) return

  // Guard: the detector reports a single FLAT amount/spend, so a one-click apply
  // can only write flat fields. If the card's current offer is TIERED, a flat
  // write would desync bonus_amount from its tiers and silently corrupt the
  // "Up to X" total (the Breeze bug). Refuse and route the editor to a proper
  // re-extraction, which rebuilds the full tiered offer + archives history.
  const { data: cur } = await supabase
    .from('credit_card_welcome_bonuses')
    .select('tiered_bonuses, bonus_amount, spend_required_usd')
    .eq('card_id', sig.card_id)
    .eq('is_current', true)
    .maybeSingle()
  const tiers = cur?.tiered_bonuses
  if (Array.isArray(tiers) && tiers.length > 0) {
    await supabase.from('card_bonus_signals').update({ status: 'needs_reextract' }).eq('id', id)
    revalidatePath('/admin/accuracy')
    throw new Error(
      'This card has a tiered welcome bonus. A one-click apply would only write the flat headline number and break the "Up to X" total. Re-extract the card instead to update the full tiered offer.',
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const update: Record<string, unknown> = { last_verified: today, verified_at: new Date().toISOString() }
  if (sig.detected_amount != null) update.bonus_amount = sig.detected_amount
  if (sig.detected_spend != null) update.spend_required_usd = sig.detected_spend

  await supabase
    .from('credit_card_welcome_bonuses')
    .update(update)
    .eq('card_id', sig.card_id)
    .eq('is_current', true)

  // Keep the card's own freshness in sync so it reads as just-verified.
  await supabase.from('credit_cards').update({ last_verified: today }).eq('id', sig.card_id)

  // The bonus DATA just changed; the good_to_know PROSE may still quote the old
  // figure. Flag the card for a prose re-check (cleared on next good_to_know
  // save) so we catch it now instead of waiting for the weekly Sonnet audit.
  await flagGoodToKnowReviewIfStale(supabase, sig.card_id, {
    oldAmount: cur?.bonus_amount ?? null,
    newAmount: sig.detected_amount ?? cur?.bonus_amount ?? null,
    oldSpend: cur?.spend_required_usd ?? null,
    newSpend: sig.detected_spend ?? cur?.spend_required_usd ?? null,
  })

  await supabase.from('card_bonus_signals').update({ status: 'applied' }).eq('id', id)
  revalidatePath('/admin/accuracy')
}

export async function dismissSignal(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('card_bonus_signals').update({ status: 'dismissed' }).eq('id', id)
  revalidatePath('/admin/accuracy')
}

/**
 * Clear a card's good_to_know prose-review flag without editing the prose - for
 * the case where the editor reviewed it and judged the prose still accurate (a
 * false positive, e.g. the old figure was an incidental number, not the bonus).
 */
export async function clearReview(formData: FormData): Promise<void> {
  await assertAdmin()
  const cardId = String(formData.get('card_id') ?? '').trim()
  if (!cardId) return
  const supabase = createAdminClient()
  await clearGoodToKnowReview(supabase, cardId)
  revalidatePath('/admin/accuracy')
}
