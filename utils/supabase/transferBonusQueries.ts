import type { SupabaseClient } from '@supabase/supabase-js'
import type { Alert, Program } from '@/utils/supabase/queries'

/**
 * Active transfer-bonus alert + its destination program metadata + any
 * "what breaks this deal" warnings derived from the destination's
 * partner_redemptions rows. The Should I Transfer? tool consumes this.
 */
export interface SweetSpotExample {
  id: string
  cabin: string
  region_or_route: string
  cost_miles_low: number | null
  cost_miles_high: number | null
  operating_carrier: { name: string; slug: string } | null
  teach_caption: string | null
}

export interface ActiveTransferBonus {
  alert: Alert
  destinationProgram: Program | null
  warnings: string[]
  examples: SweetSpotExample[]
}

/**
 * Pulls all currently-active transfer_bonus alerts. Currently-active means:
 *   - status = published
 *   - type = transfer_bonus
 *   - end_date is null OR end_date >= today
 *
 * Joins the destination program (primary_program_id) and pulls a small
 * set of "what breaks this deal" warnings from partner_redemptions
 * (rows where the destination is the currency and the row has a
 * what_breaks_this note or high fuel surcharges).
 */
export async function getActiveTransferBonuses(
  supabase: SupabaseClient,
): Promise<ActiveTransferBonus[]> {
  const today = new Date().toISOString().slice(0, 10)

  const { data: alerts, error: alertErr } = await supabase
    .from('alerts')
    .select('*')
    .eq('type', 'transfer_bonus')
    .eq('status', 'published')
    .or(`end_date.gte.${today},end_date.is.null`)
    .order('end_date', { ascending: true, nullsFirst: false })

  if (alertErr) throw alertErr

  const out: ActiveTransferBonus[] = []
  for (const a of (alerts ?? []) as Alert[]) {
    let destinationProgram: Program | null = null
    const warnings: string[] = []

    if (a.primary_program_id) {
      const { data: prog } = await supabase
        .from('programs')
        .select('*')
        .eq('id', a.primary_program_id)
        .maybeSingle()
      destinationProgram = (prog as Program | null) ?? null

      // Collect distinct what_breaks_this warnings from partner_redemptions
      // where this program is the currency (i.e., the user would spend it).
      const { data: warningRows } = await supabase
        .from('partner_redemptions')
        .select('what_breaks_this, fuel_surcharges')
        .eq('currency_program_id', a.primary_program_id)
        .eq('is_active', true)
        .not('what_breaks_this', 'is', null)
        .limit(5)

      const seen = new Set<string>()
      for (const r of warningRows ?? []) {
        if (r.what_breaks_this && !seen.has(r.what_breaks_this)) {
          seen.add(r.what_breaks_this)
          warnings.push(r.what_breaks_this)
        }
      }

      // Plus a fuel-surcharge red flag if the destination has high
      // surcharge rows on any cabin.
      const { count: highSurchargeCount } = await supabase
        .from('partner_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('currency_program_id', a.primary_program_id)
        .eq('fuel_surcharges', 'high')
        .eq('is_active', true)

      if ((highSurchargeCount ?? 0) > 0 && !warnings.some((w) => w.toLowerCase().includes('surcharg'))) {
        warnings.push(
          'High fuel surcharges on long-haul redemptions. Always check the cash co-pay before transferring.',
        )
      }
    }

    // Pull 1-2 "best of" sweet-spot examples for this destination program.
    // Definition of "best": high-quality redemptions only — easy complexity,
    // excellent/good availability, ordered by cheapest miles first. We surface
    // these to give the user a concrete "what would I actually book with this?"
    // instead of leaving them guessing.
    const examples: SweetSpotExample[] = []
    if (a.primary_program_id) {
      const { data: exRows } = await supabase
        .from('partner_redemptions')
        .select(
          `id, cabin, region_or_route, cost_miles_low, cost_miles_high, teach_caption,
           operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(name, slug)`,
        )
        .eq('currency_program_id', a.primary_program_id)
        .eq('is_active', true)
        .eq('complexity_score', 'easy')
        .in('availability_reality', ['excellent', 'good'])
        .not('cost_miles_low', 'is', null)
        .order('cost_miles_low', { ascending: true })
        .limit(2)

      for (const r of exRows ?? []) {
        const carrier = Array.isArray(r.operating_carrier)
          ? r.operating_carrier[0]
          : r.operating_carrier
        examples.push({
          id: r.id as string,
          cabin: r.cabin as string,
          region_or_route: r.region_or_route as string,
          cost_miles_low: r.cost_miles_low as number | null,
          cost_miles_high: r.cost_miles_high as number | null,
          operating_carrier: carrier
            ? { name: carrier.name as string, slug: carrier.slug as string }
            : null,
          teach_caption: (r.teach_caption as string | null) ?? null,
        })
      }
    }

    out.push({
      alert: a,
      destinationProgram,
      warnings: warnings.slice(0, 4),
      examples,
    })
  }

  return out
}

/**
 * Light heuristic to detect the source currency from an alert's title.
 * Used to filter alerts by the user's selected source. Falls back to
 * including the alert when no source can be detected (better visible
 * than missing).
 */
export function detectSourceCurrency(title: string): SourceCurrency | null {
  const t = title.toLowerCase()
  if (/\b(amex|membership rewards|mr)\b/.test(t)) return 'amex'
  if (/\b(chase|ultimate rewards|\bur\b)\b/.test(t)) return 'chase'
  if (/\b(citi|thank ?you|\bty\b)\b/.test(t)) return 'citi'
  if (/\b(capital one|cap one|venture|cap1)\b/.test(t)) return 'capital_one'
  if (/\bbilt\b/.test(t)) return 'bilt'
  if (/\b(marriott|bonvoy)\b/.test(t)) return 'marriott'
  if (/\b(world of hyatt|hyatt)\b/.test(t)) return 'hyatt'
  return null
}

export type SourceCurrency =
  | 'amex'
  | 'chase'
  | 'citi'
  | 'capital_one'
  | 'bilt'
  | 'marriott'
  | 'hyatt'

export const SOURCE_CURRENCIES: { id: SourceCurrency; label: string; short: string }[] = [
  { id: 'amex', label: 'Amex Membership Rewards', short: 'Amex MR' },
  { id: 'chase', label: 'Chase Ultimate Rewards', short: 'Chase UR' },
  { id: 'citi', label: 'Citi ThankYou', short: 'Citi TY' },
  { id: 'capital_one', label: 'Capital One Miles', short: 'Capital One' },
  { id: 'bilt', label: 'Bilt Rewards', short: 'Bilt' },
  { id: 'marriott', label: 'Marriott Bonvoy', short: 'Marriott' },
  { id: 'hyatt', label: 'World of Hyatt', short: 'Hyatt' },
]
