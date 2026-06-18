import type { SupabaseClient } from '@supabase/supabase-js'
import type { ElevatedBonusItem } from './newsletterSlots'

/**
 * Build the newsletter "Elevated Welcome Bonuses" section from card data.
 *
 * A card qualifies when its current welcome bonus is flagged is_elevated, has a
 * baseline (the normal, non-promo offer), and the current TOTAL beats that
 * baseline. The total mirrors the card-page formatter: bonus_amount (the first
 * tier) plus any additional tiers, de-duping one echo of the main amount. This
 * handles tiered offers like Breeze (30k first tier + 20k more = "up to 50k"
 * vs a 30k baseline) and excludes not-really-elevated rows where the total
 * equals the baseline.
 *
 * Detection only - auto-fills the slot; the editor trims before sending.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MAX_ITEMS = 10

interface TierLite {
  bonus_amount?: unknown
}

/** Total potential bonus = main + additional tiers (one echo of main de-duped). */
function computeTotal(bonusAmount: number, tiers: TierLite[] | null): { total: number; tiered: boolean } {
  let extras = 0
  let echoSeen = false
  for (const t of Array.isArray(tiers) ? tiers : []) {
    const amt = typeof t?.bonus_amount === 'number' ? t.bonus_amount : NaN
    if (!Number.isFinite(amt)) continue
    if (!echoSeen && amt === bonusAmount) {
      echoSeen = true
      continue
    }
    extras += amt
  }
  return { total: bonusAmount + extras, tiered: extras > 0 }
}

function fmtDeadline(iso: string | null): string | null {
  if (!iso) return null
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const month = MONTHS[parseInt(m[2], 10) - 1]
  const day = parseInt(m[3], 10)
  return month ? `Ends ${month} ${day}` : null
}

function fmtWindow(months: number | null, days: number | null): string | null {
  if (typeof days === 'number' && days > 0) return `${days} days`
  if (typeof months === 'number' && months > 0) return `${months} month${months === 1 ? '' : 's'}`
  return null
}

interface BonusRow {
  bonus_amount: number | null
  baseline_bonus_amount: number | null
  bonus_currency: string | null
  spend_required_usd: number | null
  spend_window_months: number | null
  spend_window_days: number | null
  tiered_bonuses: TierLite[] | null
  window_end: string | null
  credit_cards:
    | { slug: string; name: string; is_active: boolean; status: string }
    | { slug: string; name: string; is_active: boolean; status: string }[]
}

export async function getElevatedBonuses(supabase: SupabaseClient): Promise<ElevatedBonusItem[]> {
  const { data } = await supabase
    .from('credit_card_welcome_bonuses')
    .select(
      'bonus_amount, baseline_bonus_amount, bonus_currency, spend_required_usd, spend_window_months, spend_window_days, tiered_bonuses, window_end, credit_cards!inner(slug, name, is_active, status)',
    )
    .eq('is_current', true)
    .eq('is_elevated', true)
    .not('baseline_bonus_amount', 'is', null)

  const items: ElevatedBonusItem[] = []
  for (const r of (data ?? []) as BonusRow[]) {
    const card = Array.isArray(r.credit_cards) ? r.credit_cards[0] : r.credit_cards
    if (!card || !card.is_active || card.status !== 'active') continue
    if (r.bonus_amount == null || r.baseline_bonus_amount == null) continue

    const { total, tiered } = computeTotal(r.bonus_amount, r.tiered_bonuses)
    // Require a genuine elevation above the normal offer.
    if (total <= r.baseline_bonus_amount) continue

    items.push({
      card_name: card.name,
      baseline_amount: r.baseline_bonus_amount,
      current_amount: total,
      is_tiered: tiered,
      currency: r.bonus_currency ?? 'points',
      spend_required_usd: r.spend_required_usd,
      spend_window_label: fmtWindow(r.spend_window_months, r.spend_window_days),
      link_url: `/cards/${card.slug}`,
      deadline: fmtDeadline(r.window_end),
    })
  }

  // Biggest current offers first.
  items.sort((a, b) => b.current_amount - a.current_amount)
  return items.slice(0, MAX_ITEMS)
}
