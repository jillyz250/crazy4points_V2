import type { SupabaseClient } from '@supabase/supabase-js'
import type { PartnerRedemptionWithPrograms } from '@/utils/supabase/queries'

/**
 * Pull the "Don't Sleep On These" sweet spots — partner_redemptions rows
 * tagged with availability_reality. We populate that column SPARSELY by
 * design (only high-confidence cases), so any row that has it set is
 * worth surfacing.
 *
 * Ranking:
 *   - availability_reality "excellent" rows first (most bookable)
 *   - then "good", then "mixed"
 *   - within each tier: cheapest miles first
 *   - "rare" and "unicorn" excluded — those aren't sweet spots, they're
 *     fantasy redemptions. The point of Don't Sleep is what actually works.
 */
export async function getDontSleepSweetSpots(
  supabase: SupabaseClient,
): Promise<PartnerRedemptionWithPrograms[]> {
  const { data, error } = await supabase
    .from('partner_redemptions')
    .select(`
      *,
      currency_program:programs!partner_redemptions_currency_program_id_fkey(slug, name, alliance),
      operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(slug, name, alliance)
    `)
    .eq('is_active', true)
    .in('availability_reality', ['excellent', 'good', 'mixed'])
    .order('cost_miles_low', { ascending: true, nullsFirst: false })

  if (error) throw error

  const rows = (data ?? []) as unknown as PartnerRedemptionWithPrograms[]

  // Tier sort: excellent → good → mixed
  const tier = (r: PartnerRedemptionWithPrograms): number => {
    if (r.availability_reality === 'excellent') return 0
    if (r.availability_reality === 'good') return 1
    return 2
  }
  rows.sort((a, b) => {
    const tdiff = tier(a) - tier(b)
    if (tdiff !== 0) return tdiff
    return (a.cost_miles_low ?? 9e9) - (b.cost_miles_low ?? 9e9)
  })

  return rows
}

/**
 * Group rows by their primary route bucket for the rendered output.
 * Returns a map keyed by bucket → ordered array of rows. Rows with
 * multiple buckets are placed in their first bucket only (avoids
 * duplication on the page).
 */
export function groupByRouteBucket(
  rows: PartnerRedemptionWithPrograms[],
): Map<string, PartnerRedemptionWithPrograms[]> {
  const groups = new Map<string, PartnerRedemptionWithPrograms[]>()
  for (const r of rows) {
    const bucket = r.route_buckets?.[0] ?? 'other'
    const list = groups.get(bucket) ?? []
    list.push(r)
    groups.set(bucket, list)
  }
  return groups
}
