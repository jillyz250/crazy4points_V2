/**
 * baselineGuard — every current card bonus must have a baseline (Jill, 2026-09-05).
 *
 * The extraction flow sets baseline_bonus_amount on insert, but cards added by
 * other paths (manual SQL, ad-hoc) can slip in without one — an open loop, since
 * a missing baseline means we can't honestly tell an "increase" from the standard
 * offer. This guard closes that regardless of how the row got there:
 *   • non-elevated current bonus, no baseline  -> baseline = current amount (exact:
 *     a non-elevated offer IS the baseline). Auto-fixed.
 *   • elevated current bonus, no baseline      -> can't derive the pre-elevation
 *     standard automatically -> returned as `needsResearch` to flag for a human.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type BaselineGuardResult = { seeded: number; needsResearch: { id: string; card_id: string; bonus_amount: number }[] }

export async function baselineGuard(db: SupabaseClient, { apply = true } = {}): Promise<BaselineGuardResult> {
  const { data } = await db.from('credit_card_welcome_bonuses')
    .select('id,card_id,bonus_amount,baseline_bonus_amount,is_elevated,is_current,notes')
  const rows = (data ?? []) as { id: string; card_id: string; bonus_amount: number | null; baseline_bonus_amount: number | null; is_elevated: boolean | null; is_current: boolean | null; notes: string | null }[]
  const current = rows.filter((r) => r.is_current !== false && r.baseline_bonus_amount == null)

  const res: BaselineGuardResult = { seeded: 0, needsResearch: [] }
  for (const r of current) {
    if (r.is_elevated !== true && r.bonus_amount != null) {
      if (apply) {
        const note = ((r.notes || '') + ' | baseline auto-seeded (non-elevated current offer) by baselineGuard').trim().slice(0, 2000)
        await db.from('credit_card_welcome_bonuses').update({ baseline_bonus_amount: r.bonus_amount, notes: note }).eq('id', r.id)
      }
      res.seeded++
    } else if (r.is_elevated === true && r.bonus_amount != null) {
      res.needsResearch.push({ id: r.id, card_id: r.card_id, bonus_amount: r.bonus_amount })
    }
  }
  return res
}
