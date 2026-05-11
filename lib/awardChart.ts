/**
 * Award Chart — structured schema (v1).
 *
 * Five chart-type discriminators cover every real-world award chart:
 *   1. distance                  — pure distance bands (Etihad, Aeroplan, LifeMiles, ANA)
 *   2. zone                      — region-to-region matrix (AA, BA Avios-fixed-zone, KrisFlyer)
 *   3. distance_plus_modifiers   — bands + peak/off-peak + RFS + partner tables (Avios, Asia Miles, Qantas)
 *   4. dynamic                   — percentile ranges per bucket × cabin (United, Delta, Flying Blue)
 *   5. fixed_route               — published one-off rates (rare; chart exceptions)
 *
 * Every chart can carry:
 *   - `overrides[]`        published exceptions that win before base logic
 *   - `elite_modifiers`    reserved for future elite reductions (unused in v1 compute)
 *
 * Compute contract: `computeAwardCost(program, partner, origin, dest, cabin, opts)`
 * returns AwardCostResult or null.
 *
 * Driving plan: plans/award-chart-rebuild.md (v2.1)
 * Status: schema gate — Avios pilot validates this shape before any
 * authoring kicks off in Phase 2.
 */

import type { RouteBucket } from './airports'

// ─── Shared primitives ──────────────────────────────────────────────────────

export type Cabin = 'economy' | 'premium_economy' | 'business' | 'first'

export type Season = 'peak' | 'off_peak'

export interface PeakWindow {
  /** ISO date YYYY-MM-DD inclusive */
  start: string
  /** ISO date YYYY-MM-DD inclusive */
  end: string
}

/** A miles cost keyed by cabin. Missing cabin = not bookable at that level. */
export type CabinCosts = Partial<Record<Cabin, number>>

/** A peak/off-peak pair of cabin cost dicts (used in distance_plus_modifiers). */
export interface SeasonedCabinCosts {
  peak: CabinCosts
  off_peak: CabinCosts
}

/** Reward Flight Saver cash cap. One cap per (cabin, route bucket). */
export type RfsCaps = Partial<Record<Cabin, Partial<Record<RouteBucket, number>>>>

/** Published exception — wins before base-chart logic. */
export interface ChartOverride {
  /** IATA codes; matches one direction OR both if bidirectional=true */
  from: string
  to: string
  bidirectional?: boolean
  cabin: Cabin
  /** Required only when chart has peak_calendar */
  season?: Season
  miles: number
  note?: string
}

/** Optional elite-tier multipliers (v1 compute ignores these; reserved for v2). */
export type EliteModifiers = Record<string, number>

// ─── Type 1: distance ──────────────────────────────────────────────────────

export interface DistanceBand {
  /** Upper bound of the band, inclusive */
  max_miles: number
  cabin: CabinCosts
}

export interface DistancePartnerChart {
  bands: DistanceBand[]
}

export interface DistanceChart {
  type: 'distance'
  /** Round-trip-only programs (ANA classic). Pass-through to compute for warning. */
  rt_only?: boolean
  /** Multiplier applied if compute is asked for one-way on an RT-only chart. */
  one_way_multiplier?: number
  partners: Record<string, DistancePartnerChart>
  overrides?: ChartOverride[]
  elite_modifiers?: EliteModifiers
}

// ─── Type 2: zone ──────────────────────────────────────────────────────────

export interface ZonePartnerChart {
  /** RouteBucket → CabinCosts */
  matrix: Partial<Record<RouteBucket, CabinCosts>>
}

export interface ZoneChart {
  type: 'zone'
  partners: Record<string, ZonePartnerChart>
  overrides?: ChartOverride[]
  elite_modifiers?: EliteModifiers
}

// ─── Type 3: distance_plus_modifiers ───────────────────────────────────────

export interface DpmBand {
  max_miles: number
  peak: CabinCosts
  off_peak: CabinCosts
}

export interface DpmPartnerChart {
  bands: DpmBand[]
  /** Flat multiplier applied to base miles (e.g. partner surcharge factor). */
  multiplier?: number
  /** Optional partner-specific RFS caps; falls back to chart-level rfs_caps. */
  rfs_caps?: RfsCaps
  /** Optional partner-specific peak windows; falls back to chart-level peak_calendar. */
  peak_calendar?: PeakWindow[]
}

export interface DistancePlusModifiersChart {
  type: 'distance_plus_modifiers'
  partners: Record<string, DpmPartnerChart>
  /** Default peak calendar; partners can override per-partner. */
  peak_calendar?: PeakWindow[]
  /** Default RFS caps; partners can override per-partner. */
  rfs_caps?: RfsCaps
  overrides?: ChartOverride[]
  elite_modifiers?: EliteModifiers
}

// ─── Type 4: dynamic ───────────────────────────────────────────────────────

/** Honest percentile distribution for dynamic-priced cabins. */
export interface PercentileRange {
  p10: number
  p50: number
  p90: number
}

/** Cabin → percentile range. */
export type CabinPercentiles = Partial<Record<Cabin, PercentileRange>>

export interface DynamicPartnerChart {
  /** Coarser: bucket → cabin percentiles. */
  ranges_by_bucket?: Partial<Record<RouteBucket, CabinPercentiles>>
  /** Finer (optional): per-distance bands → cabin percentiles. */
  ranges_by_distance?: Array<{ max_miles: number } & CabinPercentiles>
}

export interface DynamicChart {
  type: 'dynamic'
  partners: Record<string, DynamicPartnerChart>
  overrides?: ChartOverride[]
  elite_modifiers?: EliteModifiers
}

// ─── Type 5: fixed_route ───────────────────────────────────────────────────

export interface FixedRouteEntry {
  from: string
  to: string
  bidirectional?: boolean
  cabin: CabinCosts
}

export interface FixedRouteChart {
  type: 'fixed_route'
  routes: FixedRouteEntry[]
  overrides?: ChartOverride[]
  elite_modifiers?: EliteModifiers
}

// ─── Discriminated union ───────────────────────────────────────────────────

/** One chart object. A program can have multiple (e.g. AA: [saver_zone, anytime_dynamic]). */
export type AwardChart =
  | DistanceChart
  | ZoneChart
  | DistancePlusModifiersChart
  | DynamicChart
  | FixedRouteChart

/**
 * Multi-chart container stored at `programs.award_chart_structured`.
 *
 * Per audit decision #3 (plans/award-chart-audit.md): JAL has zone for
 * own-metal + distance for partners, AA has zone saver + dynamic AAnytime.
 * Multiple charts let us model these without polluting individual chart
 * types with hybrid fields.
 *
 * Compute walks `charts` in order, picks the first whose partners include
 * the requested carrier, runs that chart's computer. Order matters —
 * author the more specific / preferred chart first (saver before AAnytime,
 * own-metal before partner, peak-promo before standard, etc.).
 */
export interface AwardChartProgram {
  charts: Array<AwardChart & { label?: string }>
}

// ─── Compute result ─────────────────────────────────────────────────────────

/** What computeAwardCost returns. */
export interface AwardCostResult {
  /** Single number for chart-based; {low, high} for dynamic (uses p10/p90). */
  miles: number | { low: number; high: number }
  /** Typical/expected value for sorting (single number for chart, p50 for dynamic). */
  typical: number
  /** True for chart-based; false for dynamic ranges. */
  exact: boolean
  /** "4,501–7,000 mi @ 22k" — what to surface inline on result rows. */
  band?: string
  /** Active season at the requested travel date (if chart has a calendar). */
  season?: Season
  /** "chart" | "override" | "dynamic_estimate" — for UI source-of-truth labeling. */
  source: 'chart' | 'override' | 'dynamic_estimate'
  /** Optional human-readable note (RFS cap applied, RT-only warning, etc.). */
  notes?: string
}
