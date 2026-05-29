import type { SupabaseClient } from '@supabase/supabase-js'
import type { PartnerRedemptionWithPrograms, RedemptionCabin } from '@/utils/supabase/queries'
import type { Airport, RouteBucket } from '@/lib/airports'
import { mapRouteToBucket, distanceMiles } from '@/lib/airports'
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

  // Dedup: partner_redemptions stores ONE ROW PER DISTANCE BAND per
  // (currency, carrier). The tool recomputes cost from the actual route
  // distance, so every band-row of the same pairing yields the SAME computed
  // price — they'd render as identical duplicate rows. Collapse them:
  //   - chart-computed rows: one row per (currency, carrier) — all bands
  //     recompute to the same number, so any survivor is correct. Keep the
  //     cheapest sort key (defensive; they should be equal).
  //   - stored-cost rows (no chart yet): only collapse exact-duplicate ranges,
  //     since distinct stored bands carry genuinely different numbers and we
  //     can't recompute which applies — leave those for per-program authoring.
  const routeDistance = distanceMiles(origin, destination)
  const bestByKey = new Map<string, EnrichedRedemptionRow>()
  for (const row of enriched) {
    const key = row.computed_cost
      ? `c:${row.currency_program_id}|${row.operating_carrier_id ?? ''}`
      : `s:${row.currency_program_id}|${row.operating_carrier_id ?? ''}|${row.cost_miles_low ?? ''}|${row.cost_miles_high ?? ''}`
    const existing = bestByKey.get(key)
    if (!existing || preferRow(row, existing, routeDistance)) bestByKey.set(key, row)
  }
  const deduped = Array.from(bestByKey.values())

  return deduped.slice().sort((a, b) => {
    const aRank = sortKey(a)
    const bRank = sortKey(b)
    if (aRank == null && bRank == null) return 0
    if (aRank == null) return 1
    if (bRank == null) return -1
    return aRank - bRank
  })
}

/**
 * Tie-break for duplicate band-rows of the same (currency, carrier). When the
 * cost is chart-computed, every band-row recomputes to the SAME number, but
 * each carries a different stored band LABEL in region_or_route (e.g. "AA
 * distance band 3 (1151-2000 mi)"). The stored cost_miles columns are stale
 * (they predate the chart rebuild), so we pick the band whose MILEAGE RANGE —
 * parsed from the label — actually contains this route's distance. That keeps
 * the printed label honest (no band-3 label on a band-2 route). Falls back to
 * the band whose range is nearest the distance, then to the cheaper stored
 * midpoint for chart-less rows.
 */
function preferRow(
  candidate: EnrichedRedemptionRow,
  current: EnrichedRedemptionRow,
  routeDistance: number,
): boolean {
  if (candidate.computed_cost && current.computed_cost) {
    const cand = bandMiss(candidate.region_or_route, routeDistance)
    const cur = bandMiss(current.region_or_route, routeDistance)
    if (cand !== cur) return cand < cur
    // Bands equally (mis)matched — keep the cheaper computed cost.
    return candidate.computed_cost.typical < current.computed_cost.typical
  }
  const a = sortKey(candidate)
  const b = sortKey(current)
  if (a == null) return false
  if (b == null) return true
  return a < b
}

/**
 * How badly a row's labeled mileage band misses the route distance.
 * 0 when the distance falls inside the band; otherwise the gap to the nearest
 * edge; Infinity when no "<lo>-<hi> mi" range is present in the label.
 */
function bandMiss(label: string | null, distance: number): number {
  if (!label) return Number.POSITIVE_INFINITY
  const m = label.match(/([\d,]+)\s*[-–]\s*([\d,]+)\s*mi/i)
  if (!m) return Number.POSITIVE_INFINITY
  const lo = Number(m[1].replace(/,/g, ''))
  const hi = Number(m[2].replace(/,/g, ''))
  if (Number.isNaN(lo) || Number.isNaN(hi)) return Number.POSITIVE_INFINITY
  if (distance >= lo && distance <= hi) return 0
  return distance < lo ? lo - distance : distance - hi
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
