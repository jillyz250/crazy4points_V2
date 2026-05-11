/**
 * AA AAdvantage — structured award chart
 *
 * Phase 2 batch 1 / Award Chart Rebuild (Option C).
 * Source: aa.com AAdvantage award chart, published rates (one-way, partner metal).
 * Two charts modeled:
 *   1. Saver — zone-based fixed rates per region × cabin × partner
 *   2. AAnytime — dynamic per-bucket percentile ranges
 *
 * Web Specials NOT modeled here — they're time-bounded promos surfaced via
 * the alerts feed, not the static chart. The compute engine already treats
 * those as out-of-scope.
 *
 * Confidence: MED — rates here reflect AA's published saver chart as of
 * late 2024 / early 2026. Real-time AAnytime ranges based on aggregated
 * community-observed pricing. **Verify before locking** in admin preview.
 *
 * Partners covered = AA own metal + oneworld partners + key bilaterals.
 * Same saver matrix for every partner per AA chart convention (only fuel
 * surcharge passthroughs differ, which live on partner_redemptions rows).
 */

import type { AwardChartProgram } from '../awardChart'

const AA_SAVER_MATRIX = {
  // Within US/Canada — short-haul (≤500 mi) takes us-short rate;
  // medium/transcon takes the 12.5k rate.
  'us-short':   { economy: 7500,  business: 17500, first: 25000 },
  'us-medium':  { economy: 12500, business: 25000, first: 50000 },
  // us-long here covers transcon (JFK-LAX style). Hawaii actual rate is
  // 20k Y / 35k J / 50k F; coarse bucket loses that nuance — Phase 2.5
  // will add a dedicated us-hawaii sub-bucket if user demand warrants.
  'us-long':    { economy: 12500, business: 25000, first: 50000 },
  'us-eu-east': { economy: 30000, business: 57500, first: 85000 },
  'us-eu-west': { economy: 30000, business: 57500, first: 85000 },
  'us-me-india':{ economy: 35000, business: 70000, first: 115000 },
  'us-japan':   { economy: 35000, business: 60000, first: 80000 },
  'us-se-asia': { economy: 35000, business: 70000, first: 110000 },
  'us-pacific': { economy: 40000, business: 80000, first: 110000 },
  'us-africa':  { economy: 40000, business: 75000, first: 120000 },
  // South America zone 1 (north, e.g. Lima, Bogota): 17.5k Y / 30k J
  // South America zone 2 (south, e.g. Sao Paulo, Buenos Aires): 30k Y / 57.5k J
  // Current bucket is coarse; using zone 2 to be conservative (avoids under-quoting).
  'us-samerica': { economy: 30000, business: 57500, first: 85000 },
} as const

// AA's partner list for saver-rate award bookings.
// Same matrix applies to every partner — fuel surcharges differ but live
// on partner_redemptions narrative rows (e.g. BA = high YQ).
const SAVER_PARTNERS = [
  'aa',                 // AA own metal
  'british-airways',
  'qantas',
  'cathay-pacific',
  'jal',
  'finnair',
  'qatar-airways',
  'royal-jordanian',
  'malaysia-airlines',
  'iberia',
  'royal-air-maroc',
  'alaska',             // bilateral
  'gol-linhas-aereas',  // bilateral, South America
]

const SAVER_PARTNERS_OBJ = Object.fromEntries(
  SAVER_PARTNERS.map((slug) => [slug, { matrix: AA_SAVER_MATRIX }]),
)

export const AA_AADVANTAGE_CHART: AwardChartProgram = {
  charts: [
    {
      type: 'zone',
      label: 'AAdvantage Saver',
      partners: SAVER_PARTNERS_OBJ,
      overrides: [],
    },
    {
      type: 'dynamic',
      label: 'AAdvantage AAnytime',
      // AAnytime is AA-own-metal only (partners use saver). Ranges are
      // community-observed; p50 is "typical Tuesday booking 30 days out."
      partners: {
        aa: {
          ranges_by_bucket: {
            'us-short':   { economy: { p10: 12500, p50: 25000, p90: 45000 } },
            'us-medium':  { economy: { p10: 17500, p50: 35000, p90: 60000 } },
            'us-long':    { economy: { p10: 25000, p50: 50000, p90: 90000 },
                            business: { p10: 50000, p50: 100000, p90: 180000 } },
            'us-eu-east': { economy: { p10: 60000, p50: 110000, p90: 180000 },
                            business: { p10: 130000, p50: 220000, p90: 350000 } },
            'us-eu-west': { economy: { p10: 60000, p50: 110000, p90: 180000 } },
            'us-me-india':{ economy: { p10: 75000, p50: 135000, p90: 225000 } },
            'us-japan':   { economy: { p10: 70000, p50: 125000, p90: 200000 } },
            'us-se-asia': { economy: { p10: 75000, p50: 140000, p90: 220000 } },
            'us-pacific': { economy: { p10: 80000, p50: 150000, p90: 240000 } },
            'us-samerica':{ economy: { p10: 55000, p50: 100000, p90: 160000 } },
            'us-africa':  { economy: { p10: 85000, p50: 155000, p90: 250000 } },
          },
        },
      },
      overrides: [],
    },
  ],
}
