/**
 * Aeroplan — structured award chart
 *
 * Phase 2 batch 1 / Award Chart Rebuild (Option C).
 * Source: aircanada.com/aeroplan published distance-based chart (post-2020 reform).
 *
 * Aeroplan distance bands vary by REGION of route (NA-internal vs Atlantic
 * vs Pacific). v1.1 schema supports this via `applies_to_buckets` per chart:
 * we model 3 sub-charts and bucket-scope each one. Compute walks them and
 * picks the first whose partners include the carrier AND whose
 * applies_to_buckets matches the route.
 *
 * Confidence: HIGH on US-Canada bands (heavily documented); MED on Atlantic
 * and Pacific (rates published but cross-program comparison is fuzzy).
 *
 * Partners covered = Air Canada own + Star Alliance + key bilaterals.
 */

import type { AwardChartProgram } from '../awardChart'

const STAR_PARTNERS = [
  'air-canada',
  'united',
  'lufthansa',
  'ana',
  'singapore-airlines',
  'turkish-airlines',
  'eva-air',
  'thai-airways',
  'austrian',
  'swiss',
  'brussels-airlines',
  'tap-air-portugal',
  'lot-polish',
  'aegean',
  'asiana',
  'air-china',
  'air-new-zealand',
  'avianca',
  'copa',
  'ethiopian',
  'egyptair',
  'south-african',
  'shenzhen',
  // Bilateral (non-Star) — Aeroplan signed several side deals
  'etihad',
  'emirates',
  'vistara',
  'olympic-air',
  'air-serbia',
]

// North America internal — distance bands within US/Canada and to Hawaii/Alaska
const NA_BANDS = [
  { max_miles: 500,  cabin: { economy: 6000,  business: 15000, first: 20000 } },
  { max_miles: 1500, cabin: { economy: 10000, business: 20000, first: 30000 } },
  { max_miles: 2750, cabin: { economy: 12500, business: 25000, first: 35000 } },
  { max_miles: 6000, cabin: { economy: 25000, business: 40000, first: 55000 } },
]

// Atlantic — US/Canada ↔ Europe / Middle East / India / Africa
const ATLANTIC_BANDS = [
  { max_miles: 4000,  cabin: { economy: 35000, business: 60000, first: 70000 } },
  { max_miles: 6000,  cabin: { economy: 40000, business: 70000, first: 90000 } },
  { max_miles: 22000, cabin: { economy: 50000, business: 85000, first: 120000 } },
]

// Pacific — US/Canada ↔ Asia / Pacific / South Pacific
const PACIFIC_BANDS = [
  { max_miles: 6000,  cabin: { economy: 35000, business: 75000, first: 95000 } },
  { max_miles: 10000, cabin: { economy: 45000, business: 75000, first: 105000 } },
  { max_miles: 22000, cabin: { economy: 55000, business: 90000, first: 130000 } },
]

const naPartners = Object.fromEntries(STAR_PARTNERS.map((s) => [s, { bands: NA_BANDS }]))
const atlPartners = Object.fromEntries(STAR_PARTNERS.map((s) => [s, { bands: ATLANTIC_BANDS }]))
const pacPartners = Object.fromEntries(STAR_PARTNERS.map((s) => [s, { bands: PACIFIC_BANDS }]))

export const AEROPLAN_CHART: AwardChartProgram = {
  charts: [
    {
      type: 'distance',
      label: 'Aeroplan — North America',
      applies_to_buckets: ['us-short', 'us-medium', 'us-long'],
      partners: naPartners,
      overrides: [],
    },
    {
      type: 'distance',
      label: 'Aeroplan — Atlantic',
      applies_to_buckets: ['us-eu-east', 'us-eu-west', 'us-me-india', 'us-africa'],
      partners: atlPartners,
      overrides: [],
    },
    {
      type: 'distance',
      label: 'Aeroplan — Pacific',
      applies_to_buckets: ['us-japan', 'us-se-asia', 'us-pacific'],
      partners: pacPartners,
      overrides: [],
    },
  ],
}
