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
import { distanceMiles, mapRouteToBucket, ROUTE_BUCKET_LABELS } from './airports'

// ─── Public API ────────────────────────────────────────────────────────────

export interface ComputeOptions {
  /** ISO date YYYY-MM-DD for peak/off-peak resolution. */
  travelDate?: string
  /** Future: elite tier; unused in v1 compute. */
  eliteTier?: string
}

/**
 * Why a route did or didn't price. `computeAwardCost` collapses this to
 * `AwardCostResult | null` for the hot path; the diagnostic distinguishes a
 * LEGIT fallback (no chart / partner not in the chart) from a real BUG
 * (`chart-miss`: a chart claims to cover the partner+bucket but fails to price
 * it). Used only by the integrity check + the fuzz harness — never on render.
 */
export type AwardDiagnosisKind =
  | 'computed'            // a chart produced a number
  | 'no-structured-chart' // program has no structured chart -> legit stored-cost fallback
  | 'not-covered'         // charts exist but none cover (partner, bucket) -> legit fallback
  | 'chart-miss'          // a chart COVERS (partner, bucket) but returned null -> BUG
  | 'invalid-input'       // null/partial airport

export interface AwardDiagnosis {
  kind: AwardDiagnosisKind
  result: AwardCostResult | null // set iff kind === 'computed'
  reason?: string
  partnerSlug?: string
  bucket?: string | null
  cabin?: Cabin
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
  // Delegates to the diagnostic so there is ONE walk of the charts (guaranteed
  // parity). The hot path just wants the value-or-null.
  const d = diagnoseAwardCost(program, partnerSlug, origin, destination, cabin, opts)
  return d.kind === 'computed' ? d.result : null
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

// ─── Bucket-level compute ──────────────────────────────────────────────────
//
// Some Hub surfaces (Should I Transfer top sweet spot, Where Can I Go,
// Don't Sleep) work in BUCKETS, not specific routes. They need:
//   "typical cost for this (program × carrier × bucket × cabin)"
// without a concrete origin/dest. This helper picks a representative
// midpoint distance per bucket for distance/DPM charts, and a direct
// matrix lookup for zone/dynamic charts.
//
// For programs without a structured chart, returns null and callers should
// fall back to partner_redemptions.cost_miles_low/high.

import type { RouteBucket } from './airports'

/** Representative great-circle distance per bucket (rough midpoint). */
const BUCKET_TYPICAL_DISTANCE: Record<RouteBucket, number> = {
  'us-short':   400,
  'us-medium':  1500,
  'us-long':    3500,
  'us-mexico-carib': 1500,
  'us-camerica': 2200,
  'us-canada':  1200,
  'us-eu-east': 4000,
  'us-eu-west': 6000,
  'us-japan':   6500,
  'us-se-asia': 9000,
  'us-me-india':7500,
  'us-pacific': 8000,
  'us-africa':  8000,
  'us-samerica':5500,
}

export function computeBucketTypicalCost(
  program: AwardChartProgram | null | undefined,
  partnerSlug: string,
  bucket: RouteBucket,
  cabin: Cabin,
): AwardCostResult | null {
  const d = diagnoseBucketTypicalCost(program, partnerSlug, bucket, cabin)
  return d.kind === 'computed' ? d.result : null
}

/**
 * Route-level diagnosis (the classifier `computeAwardCost` delegates to).
 * Same chart walk + helpers, but reports WHY — so a `chart-miss` (chart claims
 * to cover the route but can't price it) is distinguishable from a legit
 * fallback. Pure + deterministic.
 */
export function diagnoseAwardCost(
  program: AwardChartProgram | null | undefined,
  partnerSlug: string,
  origin: Airport,
  destination: Airport,
  cabin: Cabin,
  opts: ComputeOptions = {},
): AwardDiagnosis {
  if (!origin || !destination)
    return { kind: 'invalid-input', result: null, reason: 'null/undefined airport', partnerSlug, cabin }
  if (!program?.charts?.length)
    return { kind: 'no-structured-chart', result: null, partnerSlug, cabin }

  const bucket = mapRouteToBucket(origin, destination)
  const covering = program.charts.filter(
    (c) => chartCoversPartner(c, partnerSlug) && chartAppliesToBucket(c, bucket),
  )
  if (covering.length === 0)
    return { kind: 'not-covered', result: null, partnerSlug, bucket, cabin }

  for (const chart of covering) {
    const result = computeOne(chart, partnerSlug, origin, destination, cabin, opts)
    if (result) return { kind: 'computed', result, partnerSlug, bucket, cabin }
  }
  return {
    kind: 'chart-miss',
    result: null,
    reason: `${covering.length} chart(s) cover ${partnerSlug}/${bucket} but none priced ${cabin}`,
    partnerSlug,
    bucket,
    cabin,
  }
}

/** Bucket-level twin of diagnoseAwardCost (no airports -> never invalid-input). */
export function diagnoseBucketTypicalCost(
  program: AwardChartProgram | null | undefined,
  partnerSlug: string,
  bucket: RouteBucket,
  cabin: Cabin,
): AwardDiagnosis {
  if (!program?.charts?.length)
    return { kind: 'no-structured-chart', result: null, partnerSlug, bucket, cabin }

  const covering = program.charts.filter(
    (c) => chartCoversPartner(c, partnerSlug) && chartAppliesToBucket(c, bucket),
  )
  if (covering.length === 0)
    return { kind: 'not-covered', result: null, partnerSlug, bucket, cabin }

  for (const chart of covering) {
    const result = computeOneForBucket(chart, partnerSlug, bucket, cabin)
    if (result) return { kind: 'computed', result, partnerSlug, bucket, cabin }
  }
  return {
    kind: 'chart-miss',
    result: null,
    reason: `${covering.length} chart(s) cover ${partnerSlug}/${bucket} but none priced ${cabin} (bucket)`,
    partnerSlug,
    bucket,
    cabin,
  }
}

function computeOneForBucket(
  chart: AwardChart,
  partnerSlug: string,
  bucket: RouteBucket,
  cabin: Cabin,
): AwardCostResult | null {
  switch (chart.type) {
    case 'zone': {
      const partner = chart.partners[partnerSlug]
      const cost = partner?.matrix[bucket]?.[cabin]
      if (cost == null) return null
      return { miles: cost, typical: cost, exact: true, source: 'chart', band: ROUTE_BUCKET_LABELS[bucket] }
    }
    case 'dynamic': {
      const partner = chart.partners[partnerSlug]
      const pct = partner?.ranges_by_bucket?.[bucket]?.[cabin]
      if (!pct) return null
      return {
        miles: { low: pct.p10, high: pct.p90 },
        typical: pct.p50,
        exact: false,
        source: 'dynamic_estimate',
        band: ROUTE_BUCKET_LABELS[bucket],
        notes: 'Dynamic pricing — expect the typical figure on most days.',
      }
    }
    case 'distance':
    case 'distance_plus_modifiers': {
      const distance = BUCKET_TYPICAL_DISTANCE[bucket]
      const partner = chart.partners[partnerSlug] as { bands?: Array<{ max_miles: number; cabin?: Record<string, number>; peak?: Record<string, number>; off_peak?: Record<string, number> }>; multiplier?: number } | undefined
      if (!partner?.bands) return null
      let prevMax = 0
      for (const band of partner.bands) {
        if (distance <= band.max_miles) {
          // distance chart has `cabin`; DPM has peak/off_peak — use off_peak default
          const cost = band.cabin?.[cabin] ?? band.off_peak?.[cabin]
          if (cost == null) return null
          const mult = partner.multiplier ?? 1.0
          const finalCost = Math.round(cost * mult)
          return {
            miles: finalCost,
            typical: finalCost,
            exact: true,
            source: 'chart',
            band: `${(prevMax + 1).toLocaleString()}–${band.max_miles.toLocaleString()} mi @ ${fmtKilo(finalCost)}`,
            season: chart.type === 'distance_plus_modifiers' ? 'off_peak' : undefined,
          }
        }
        prevMax = band.max_miles
      }
      return null
    }
    case 'fixed_route':
      // No bucket-level concept for fixed routes; caller falls back to stored.
      return null
  }
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
    band: ROUTE_BUCKET_LABELS[bucket],
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
      band: ROUTE_BUCKET_LABELS[bucket],
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
