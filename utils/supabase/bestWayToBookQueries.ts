import type { SupabaseClient } from '@supabase/supabase-js'
import type { PartnerRedemptionWithPrograms, RedemptionCabin } from '@/utils/supabase/queries'
import type { RouteBucket } from '@/lib/airports'

/**
 * Pull all partner_redemptions rows matching a given route bucket + cabin.
 *
 * Sort strategy: by **typical** cost (midpoint of low/high when both set,
 * otherwise the single value). Sorting by the floor (cost_miles_low) was
 * pushing dynamic-pricing rows with unrealistic floors (e.g. United's 5k
 * domestic floor) to the top spot for long-haul routes like JFK-HNL.
 * Sorting by midpoint reflects what a realistic booking would actually
 * cost on average.
 *
 * NULL costs sort to the bottom — those are rows where we know the
 * option exists but haven't authored a specific rate.
 */
export async function getRedemptionsForBucket(
  supabase: SupabaseClient,
  bucket: RouteBucket,
  cabin: RedemptionCabin,
): Promise<PartnerRedemptionWithPrograms[]> {
  const { data, error } = await supabase
    .from('partner_redemptions')
    .select(`
      *,
      currency_program:programs!partner_redemptions_currency_program_id_fkey(slug, name, alliance),
      operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(slug, name, alliance)
    `)
    .eq('is_active', true)
    .eq('cabin', cabin)
    .contains('route_buckets', [bucket])

  if (error) throw error

  const rows = (data ?? []) as unknown as PartnerRedemptionWithPrograms[]

  return rows.slice().sort((a, b) => {
    const aRank = typicalCost(a.cost_miles_low, a.cost_miles_high)
    const bRank = typicalCost(b.cost_miles_low, b.cost_miles_high)
    // NULL costs to the bottom
    if (aRank == null && bRank == null) return 0
    if (aRank == null) return 1
    if (bRank == null) return -1
    return aRank - bRank
  })
}

function typicalCost(low: number | null, high: number | null): number | null {
  if (low != null && high != null) return Math.round((low + high) / 2)
  return low ?? high
}
