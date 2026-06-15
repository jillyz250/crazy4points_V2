'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * The welcome-bonus monitor is detection-only: it flags cards whose live sign-up
 * bonus differs from our stored value. The editor reviews, then either applies
 * the detected value (one click) or dismisses the signal.
 */

export async function applySignal(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()

  const { data: sig } = await supabase
    .from('card_bonus_signals')
    .select('card_id, detected_amount, detected_spend')
    .eq('id', id)
    .maybeSingle()
  if (!sig) return

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

  await supabase.from('card_bonus_signals').update({ status: 'applied' }).eq('id', id)
  revalidatePath('/admin/card-bonus-signals')
}

export async function dismissSignal(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('card_bonus_signals').update({ status: 'dismissed' }).eq('id', id)
  revalidatePath('/admin/card-bonus-signals')
}
