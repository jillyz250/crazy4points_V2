/**
 * Award Chart compute engine — Phase 1 (Option C rebuild).
 *
 * Ported + extended from scripts/avios-pilot.mjs which validated the schema
 * with 15/15 passing tests for distance_plus_modifiers. This file adds:
 *   - multi-chart walker (AwardChartProgram → first matching chart wins)
 *   - distance branch
 *   - zone branch
 *   - dynamic branch (p10/p50/p90)
 *   - fixed_route branch
 *
 * Compute contract: `computeAwardCost(programChart, partnerSlug, origin,
 * dest, cabin, opts)` returns AwardCostResult | null.
 *
 * See lib/awardChart.ts for the schema types.
 * See plans/award-chart-rebuild.md for the design.
 */

import type {
  AwardChart,
  AwardChartProgram,
  AwardCostResult,
  Cabin,
  ChartOverride,
  DistanceChart,
  DistancePlusModifiersChart,
  DynamicChart,
  FixedRouteChart,
  PeakWindow,
  Season,
  ZoneChart,
} from './awardChart'
import type { Airport } from './airports'
import { distanceMiles, mapRouteToBucket } from './airports'

// ─── Public API ────────────────────────────────────────────────────────────

export interface ComputeOptions {
  /** ISO date YYYY-MM-DD for peak/off-peak resolution. */
  travelDate?: string
  /** Future: elite tier; unused in v1 compute. */
  eliteTier?: string
}

/**
 * Top-level entry point: walks every chart on the program, picks the first
 * whose partners include the requested carrier, and runs that chart's
 * computer. Order in `program.charts[]` matters — more specific / preferred
 * charts go first (saver before AAnytime, own-metal before partner).
 */
export function computeAwardCost(
  program: AwardChartProgram | null | undefined,
  partnerSlug: string,
  origin: Airport,
  destination: Airport,
  cabin: Cabin,
  opts: ComputeOptions = {},
): AwardCostResult | null {
  if (!program?.charts?.length) return null

  const bucket = mapRouteToBucket(origin, destination)
  for (const chart of program.charts) {
    if (!chartCoversPartner(chart, partnerSlug)) continue
    if (!chartAppliesToBucket(chart, bucket)) continue
    const result = computeOne(chart, partnerSlug, origin, destination, cabin, opts)
    if (result) return result
  }
  return null
}

/**
 * v1.1 (Aeroplan authoring surfaced gap): some charts only apply to certain
 * route buckets (NA-internal distance bands ≠ Atlantic-crossing bands).
 * If the chart specifies applies_to_buckets, skip when route's bucket isn't
 * in the list. Charts without the field match any bucket.
 */
function chartAppliesToBucket(chart: AwardChart, bucket: string | null): boolean {
  const allowed = (chart as { applies_to_buckets?: string[] }).applies_to_buckets
  if (!allowed?.length) return true
  if (!bucket) return false
  return allowed.includes(bucket)
}

// ─── Chart-level dispatch ──────────────────────────────────────────────────

function computeOne(
  chart: AwardChart,
  partnerSlug: string,
  origin: Airport,
  destination: Airport,
  cabin: Cabin,
  opts: ComputeOptions,
): AwardCostResult | null {
  // Overrides ALWAYS run first across every chart type.
  const peakCalendar = 'peak_calendar' in chart ? chart.peak_calendar : undefined
  const season: Season | undefined = peakCalendar
    ? inPeakWindow(peakCalendar, opts.travelDate)
      ? 'peak'
      : 'off_peak'
    : undefined
  const ov = matchOverride(chart.overrides, origin, destination, cabin, season)
  if (ov) return ov

  switch (chart.type) {
    case 'distance':
      return computeDistance(chart, partnerSlug, origin, destination, cabin)
    case 'zone':
      return computeZone(chart, partnerSlug, origin, destination, cabin)
    case 'distance_plus_modifiers':
      return computeDistancePlusModifiers(chart, partnerSlug, origin, destination, cabin, opts)
    case 'dynamic':
      return computeDynamic(chart, partnerSlug, origin, destination, cabin)
    case 'fixed_route':
      return computeFixedRoute(chart, origin, destination, cabin)
  }
}

// ─── Type: distance ────────────────────────────────────────────────────────

function computeDistance(
  chart: DistanceChart,
  partnerSlug: string,
  origin: Airport,
  destination: Airport,
  cabin: Cabin,
): AwardCostResult | null {
  const partner = chart.partners[partnerSlug]
  if (!partner) return null
  const distance = distanceMiles(origin, destination)
  let prevMax = 0
  for (const band of partner.bands) {
    if (distance <= band.max_miles) {
      const cost = band.cabin[cabin]
      if (cost == null) return null
      const finalCost = chart.rt_only
        ? Math.round(cost * (chart.one_way_multiplier ?? 0.5))
        : cost
      return {
        miles: finalCost,
        typical: finalCost,
        exact: true,
        source: 'chart',
        band: bandLabel(prevMax, band.max_miles, finalCost),
        notes: chart.rt_only
          ? 'Round-trip-only chart; shown as one-way equivalent.'
          : undefined,
      }
    }
    prevMax = band.max_miles
  }
  return null
}

// ─── Type: zone ────────────────────────────────────────────────────────────

function computeZone(
  chart: ZoneChart,
  partnerSlug: string,
  origin: Airport,
  destination: Airport,
  cabin: Cabin,
): AwardCostResult | null {
  const partner = chart.partners[partnerSlug]
  if (!partner) return null
  const bucket = mapRouteToBucket(origin, destination)
  if (!bucket) return null
  const cell = partner.matrix[bucket]
  const cost = cell?.[cabin]
  if (cost == null) return null
  return {
    miles: cost,
    typical: cost,
    exact: true,
    source: 'chart',
    band: bucket,
  }
}

// ─── Type: distance_plus_modifiers ─────────────────────────────────────────

function computeDistancePlusModifiers(
  chart: DistancePlusModifiersChart,
  partnerSlug: string,
  origin: Airport,
  destination: Airport,
  cabin: Cabin,
  opts: ComputeOptions,
): AwardCostResult | null {
  const partner = chart.partners[partnerSlug]
  if (!partner) return null

  // Partner-level peak calendar wins over chart-level
  const calendar = partner.peak_calendar ?? chart.peak_calendar
  const season: Season = inPeakWindow(calendar, opts.travelDate) ? 'peak' : 'off_peak'

  const distance = distanceMiles(origin, destination)
  let prevMax = 0
  for (const band of partner.bands) {
    if (distance <= band.max_miles) {
      const cost = band[season]?.[cabin]
      if (cost == null) return null
      const multiplier = partner.multiplier ?? 1.0
      const finalCost = Math.round(cost * multiplier)
      return {
        miles: finalCost,
        typical: finalCost,
        exact: true,
        source: 'chart',
        season,
        band: bandLabel(prevMax, band.max_miles, finalCost),
      }
    }
    prevMax = band.max_miles
  }
  return null
}

// ─── Type: dynamic ─────────────────────────────────────────────────────────

function computeDynamic(
  chart: DynamicChart,
  partnerSlug: string,
  origin: Airport,
  destination: Airport,
  cabin: Cabin,
): AwardCostResult | null {
  const partner = chart.partners[partnerSlug]
  if (!partner) return null

  // Prefer fine-grained ranges_by_distance if present and route falls in one
  if (partner.ranges_by_distance?.length) {
    const distance = distanceMiles(origin, destination)
    for (const band of partner.ranges_by_distance) {
      if (distance <= band.max_miles) {
        const pct = band[cabin]
        if (!pct) return null
        return {
          miles: { low: pct.p10, high: pct.p90 },
          typical: pct.p50,
          exact: false,
          source: 'dynamic_estimate',
          band: `≤${band.max_miles.toLocaleString()} mi`,
        }
      }
    }
  }

  // Fall back to per-bucket ranges
  if (partner.ranges_by_bucket) {
    const bucket = mapRouteToBucket(origin, destination)
    if (!bucket) return null
    const cell = partner.ranges_by_bucket[bucket]
    const pct = cell?.[cabin]
    if (!pct) return null
    return {
      miles: { low: pct.p10, high: pct.p90 },
      typical: pct.p50,
      exact: false,
      source: 'dynamic_estimate',
      band: bucket,
      notes: 'Dynamic pricing — expect the typical figure on most days.',
    }
  }

  return null
}

// ─── Type: fixed_route ─────────────────────────────────────────────────────

function computeFixedRoute(
  chart: FixedRouteChart,
  origin: Airport,
  destination: Airport,
  cabin: Cabin,
): AwardCostResult | null {
  for (const r of chart.routes) {
    const fwd  = r.from === origin.iata && r.to === destination.iata
    const back = r.bidirectional && r.from === destination.iata && r.to === origin.iata
    if (!(fwd || back)) continue
    const cost = r.cabin[cabin]
    if (cost == null) return null
    return {
      miles: cost,
      typical: cost,
      exact: true,
      source: 'chart',
    }
  }
  return null
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function chartCoversPartner(chart: AwardChart, partnerSlug: string): boolean {
  if (chart.type === 'fixed_route') return chart.routes.length > 0 // fixed_route applies regardless
  return partnerSlug in chart.partners
}

function inPeakWindow(calendar: PeakWindow[] | undefined, dateIso: string | undefined): boolean {
  if (!dateIso || !calendar?.length) return false
  return calendar.some((w) => dateIso >= w.start && dateIso <= w.end)
}

function matchOverride(
  overrides: ChartOverride[] | undefined,
  origin: Airport,
  destination: Airport,
  cabin: Cabin,
  season: Season | undefined,
): AwardCostResult | null {
  if (!overrides?.length) return null
  for (const o of overrides) {
    const fwd  = o.from === origin.iata && o.to === destination.iata
    const back = o.bidirectional && o.from === destination.iata && o.to === origin.iata
    if (!(fwd || back)) continue
    if (o.cabin !== cabin) continue
    if (o.season && season && o.season !== season) continue
    return {
      miles: o.miles,
      typical: o.miles,
      exact: true,
      source: 'override',
      season: o.season ?? season,
      notes: o.note,
    }
  }
  return null
}

function fmtKilo(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
}

function bandLabel(prevMax: number, maxMiles: number, finalCost: number): string {
  const lo = prevMax + 1
  return `${lo.toLocaleString()}–${maxMiles.toLocaleString()} mi @ ${fmtKilo(finalCost)}`
}
