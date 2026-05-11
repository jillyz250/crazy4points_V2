import type { SupabaseClient } from '@supabase/supabase-js'
import type { PartnerRedemptionWithPrograms, RedemptionCabin } from '@/utils/supabase/queries'
import type { RouteBucket } from '@/lib/airports'

/**
 * Pull all partner_redemptions rows matching a given route bucket + cabin.
 * Returns rows sorted by cost_miles_low ascending (cheapest first), with
 * NULL costs at the bottom (rows where we know the option exists but
 * haven't authored a specific rate).
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
    .order('cost_miles_low', { ascending: true, nullsFirst: false })

  if (error) throw error
  return (data ?? []) as unknown as PartnerRedemptionWithPrograms[]
}
