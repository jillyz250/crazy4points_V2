import type { SupabaseClient } from '@supabase/supabase-js'
import type { PartnerRedemptionWithPrograms } from '@/utils/supabase/queries'
import type { AwardChartProgram, AwardCostResult, Cabin } from '@/lib/awardChart'
import type { RouteBucket } from '@/lib/airports'
import { findAirport } from '@/lib/airports'
import { computeAwardCost, computeBucketTypicalCost } from '@/lib/awardChart.compute'

const REDEMPTION_TO_CHART_CABIN: Record<string, Cabin> = {
  'Economy': 'economy',
  'Premium Economy': 'premium_economy',
  'Business': 'business',
  'First': 'first',
}

/**
 * Row enriched with chart-computed cost when destination program has a chart.
 */
export interface EnrichedSweetSpot extends PartnerRedemptionWithPrograms {
  computed_cost: AwardCostResult | null
}

/**
 * Pull the "Don't Sleep On These" sweet spots — partner_redemptions rows
 * tagged with availability_reality. We populate that column SPARSELY by
 * design (only high-confidence cases), so any row that has it set is
 * worth surfacing.
 *
 * Ranking:
 *   - availability_reality "excellent" rows first (most bookable)
 *   - then "good", then "mixed"
 *   - within each tier: cheapest miles first (uses chart-computed cost when
 *     destination program has a chart authored)
 *   - "rare" and "unicorn" excluded — those aren't sweet spots, they're
 *     fantasy redemptions. The point of Don't Sleep is what actually works.
 */
export async function getDontSleepSweetSpots(
  supabase: SupabaseClient,
): Promise<EnrichedSweetSpot[]> {
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

  const baseRows = (data ?? []) as unknown as PartnerRedemptionWithPrograms[]

  // Batch-fetch destination charts for compute enrichment.
  const uniqueCurrencyIds = Array.from(
    new Set(baseRows.map((r) => r.currency_program_id).filter(Boolean)),
  )
  const chartByProgramId = new Map<string, AwardChartProgram | null>()
  if (uniqueCurrencyIds.length > 0) {
    const { data: programs } = await supabase
      .from('programs')
      .select('id, award_chart_structured')
      .in('id', uniqueCurrencyIds)
    for (const p of programs ?? []) {
      chartByProgramId.set(p.id as string, (p.award_chart_structured as AwardChartProgram | null) ?? null)
    }
  }

  const rows: EnrichedSweetSpot[] = baseRows.map((r) => {
    const chart = chartByProgramId.get(r.currency_program_id) ?? null
    const carrierSlug = r.operating_carrier?.slug ?? null
    const chartCabin = REDEMPTION_TO_CHART_CABIN[r.cabin as string] ?? 'economy'
    let computed: AwardCostResult | null = null
    if (chart && carrierSlug) {
      if (r.origin_iata && r.dest_iata) {
        const o = findAirport(r.origin_iata)
        const d = findAirport(r.dest_iata)
        if (o && d) computed = computeAwardCost(chart, carrierSlug, o, d, chartCabin)
      }
      if (!computed) {
        const buckets = (r.route_buckets ?? []) as string[]
        if (buckets.length > 0) {
          computed = computeBucketTypicalCost(chart, carrierSlug, buckets[0] as RouteBucket, chartCabin)
        }
      }
    }
    return { ...r, computed_cost: computed }
  })

  // Tier sort: excellent → good → mixed. Within tier, use computed cost
  // when available; fall back to stored cost_miles_low.
  const tier = (r: EnrichedSweetSpot): number => {
    if (r.availability_reality === 'excellent') return 0
    if (r.availability_reality === 'good') return 1
    return 2
  }
  const sortKey = (r: EnrichedSweetSpot): number => {
    if (r.computed_cost) return r.computed_cost.typical
    return r.cost_miles_low ?? 9e9
  }
  rows.sort((a, b) => {
    const tdiff = tier(a) - tier(b)
    if (tdiff !== 0) return tdiff
    return sortKey(a) - sortKey(b)
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
  rows: EnrichedSweetSpot[],
): Map<string, EnrichedSweetSpot[]> {
  const groups = new Map<string, EnrichedSweetSpot[]>()
  for (const r of rows) {
    const bucket = r.route_buckets?.[0] ?? 'other'
    const list = groups.get(bucket) ?? []
    list.push(r)
    groups.set(bucket, list)
  }
  return groups
}
