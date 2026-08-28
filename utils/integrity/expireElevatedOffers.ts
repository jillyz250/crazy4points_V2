import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Auto-revert elevated welcome-bonus offers once their limited-time window closes.
 *
 * An elevated offer is a current welcome-bonus row with `is_elevated = true` and a
 * `window_end` date (e.g. Delta Gold "80k + $250 through Nov 4"). When that date
 * passes, the "Elevated offer" badge and the statement-credit line must stop
 * showing, or the card page misleads. This demotes the row:
 *  - is_elevated -> false, extras -> null, window_end -> null
 *  - bonus_amount -> baseline_bonus_amount (restore the standard mile count, when set)
 *  - baseline_bonus_amount -> null (no longer an elevation)
 *  - stamps last_verified stale so the Refresh-queue phase re-confirms the exact
 *    current STANDARD terms (spend requirement especially, which the elevated offer
 *    may have raised and we don't separately preserve).
 * Idempotent and safe to run daily; touches only rows whose window has closed.
 */
export interface ExpireResult {
  ok: boolean
  reverted: number
  cards: string[]
}

export async function expireElevatedOffers(
  supabase: SupabaseClient,
  today: string = new Date().toISOString().slice(0, 10),
): Promise<ExpireResult> {
  const { data, error } = await supabase
    .from('credit_card_welcome_bonuses')
    .select('id, card_id, bonus_amount, baseline_bonus_amount, window_end, notes, credit_cards!inner(slug)')
    .eq('is_current', true)
    .eq('is_elevated', true)
    .not('window_end', 'is', null)
    .lt('window_end', today)

  if (error) return { ok: false, reverted: 0, cards: [] }
  const rows = (data ?? []) as Array<{
    id: string
    bonus_amount: number | null
    baseline_bonus_amount: number | null
    window_end: string | null
    notes: string | null
    credit_cards: { slug: string } | { slug: string }[]
  }>

  const cards: string[] = []
  for (const r of rows) {
    const slug = Array.isArray(r.credit_cards) ? r.credit_cards[0]?.slug : r.credit_cards?.slug
    const restored = r.baseline_bonus_amount ?? r.bonus_amount
    const note = `${r.notes ? r.notes + ' ' : ''}[auto-revert ${today}] Elevated offer window (${r.window_end}) passed; reverted to baseline. Re-verify current standard terms.`
    const { error: upErr } = await supabase
      .from('credit_card_welcome_bonuses')
      .update({
        is_elevated: false,
        extras: null,
        window_end: null,
        bonus_amount: restored,
        baseline_bonus_amount: null,
        notes: note,
        last_verified: '2000-01-01', // stale on purpose so the refresh queue re-verifies
      })
      .eq('id', r.id)
    if (!upErr && slug) cards.push(slug)
  }
  return { ok: true, reverted: cards.length, cards }
}
