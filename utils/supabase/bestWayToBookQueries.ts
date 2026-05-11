import type { SupabaseClient } from '@supabase/supabase-js'
import type { PartnerRedemptionWithPrograms, RedemptionCabin } from '@/utils/supabase/queries'
import type { Airport, RouteBucket } from '@/lib/airports'
import { mapRouteToBucket } from '@/lib/airports'
import type { AwardChartProgram, AwardCostResult, Cabin } from '@/lib/awardChart'
import { computeAwardCost } from '@/lib/awardChart.compute'

/** Row enriched with chart-computed cost when the program has a chart authored. */
export interface EnrichedRedemptionRow extends PartnerRedemptionWithPrograms {
  /** Chart-computed cost for this exact route. Null when no chart authored
   *  for the program, or chart doesn't cover this carrier × bucket × cabin. */
  computed_cost: AwardCostResult | null
}

const REDEMPTION_CABIN_TO_CHART: Record<RedemptionCabin, Cabin> = {
  'Economy': 'economy',
  'Premium Economy': 'premium_economy',
  'Business': 'business',
  'First': 'first',
}

/**
 * Phase 3 of Award Chart Rebuild: fetch rows matching a route bucket + cabin,
 * then enrich each row with chart-computed cost for the actual origin/dest.
 *
 * Strategy:
 *   1. Pull all active rows matching the route bucket + cabin.
 *   2. Batch-fetch each unique currency program's award_chart_structured.
 *   3. For each row: compute cost via computeAwardCost(chart, carrier,
 *      origin, dest, cabin). Attach as `computed_cost`.
 *   4. Sort by computed.typical when available; fall back to midpoint of
 *      stored cost_miles_low/high otherwise (programs without a chart yet).
 *
 * The dual sort key means programs with authored charts get HONEST costs
 * (e.g. Etihad/AA Hawaii Y = 22k, not 7-10k from stored bucket-collapsed
 * range), while unauthored programs still surface their stored midpoint.
 */
export async function getRedemptionsForRoute(
  supabase: SupabaseClient,
  origin: Airport,
  destination: Airport,
  cabin: RedemptionCabin,
): Promise<EnrichedRedemptionRow[]> {
  const bucket = mapRouteToBucket(origin, destination)
  if (!bucket) return []

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
  if (rows.length === 0) return []

  // Batch-fetch the chart JSON for every unique currency program in results.
  const uniqueCurrencyIds = Array.from(
    new Set(rows.map((r) => r.currency_program_id).filter(Boolean)),
  )
  const chartByProgramId = new Map<string, AwardChartProgram | null>()
  if (uniqueCurrencyIds.length > 0) {
    const { data: programs } = await supabase
      .from('programs')
      .select('id, award_chart_structured')
      .in('id', uniqueCurrencyIds)
    for (const p of programs ?? []) {
      chartByProgramId.set(
        p.id as string,
        (p.award_chart_structured as AwardChartProgram | null) ?? null,
      )
    }
  }

  const chartCabin = REDEMPTION_CABIN_TO_CHART[cabin]

  const enriched: EnrichedRedemptionRow[] = rows.map((r) => {
    const chart = chartByProgramId.get(r.currency_program_id) ?? null
    const carrierSlug = r.operating_carrier?.slug ?? null
    let computed: AwardCostResult | null = null
    if (chart && carrierSlug) {
      computed = computeAwardCost(chart, carrierSlug, origin, destination, chartCabin)
    }
    return { ...r, computed_cost: computed }
  })

  return enriched.slice().sort((a, b) => {
    const aRank = sortKey(a)
    const bRank = sortKey(b)
    if (aRank == null && bRank == null) return 0
    if (aRank == null) return 1
    if (bRank == null) return -1
    return aRank - bRank
  })
}

function sortKey(row: EnrichedRedemptionRow): number | null {
  // Chart-computed cost wins
  if (row.computed_cost) return row.computed_cost.typical
  // Fall back to stored midpoint (legacy behavior for unauthored programs)
  return typicalStored(row.cost_miles_low, row.cost_miles_high)
}

function typicalStored(low: number | null, high: number | null): number | null {
  if (low != null && high != null) return Math.round((low + high) / 2)
  return low ?? high
}

/**
 * Legacy entry point — kept for backwards compat with surfaces that don't
 * yet have airport objects to pass in. Returns rows without computed_cost.
 *
 * @deprecated Use getRedemptionsForRoute when origin + dest are available.
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
    const aRank = typicalStored(a.cost_miles_low, a.cost_miles_high)
    const bRank = typicalStored(b.cost_miles_low, b.cost_miles_high)
    if (aRank == null && bRank == null) return 0
    if (aRank == null) return 1
    if (bRank == null) return -1
    return aRank - bRank
  })
}
