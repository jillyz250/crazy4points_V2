/**
 * United MileagePlus — structured award chart
 *
 * Phase 2 batch 1 / Award Chart Rebuild (Option C).
 * Source: united.com/ual/en/us/account/mileageplus — fully dynamic pricing
 * post-2019. No published static chart; bands here are aggregated from
 * community observations + flight-search sampling.
 *
 * This chart FIXES THE ORIGINAL BUG that triggered the rebuild: a single
 * 5k-50k range collapsed across all US route buckets was lying about
 * JFK-HNL pricing. Per-bucket p10/p50/p90 ranges are honest about the
 * distribution.
 *
 * Confidence: MED on own-metal (community-aggregated); MED on Star Alliance
 * partner saver rates (United's published-but-volatile partner chart).
 *
 * Partners: United own + Star Alliance saver rates + Aeroplan (close
 * partner). Aeroplan-as-currency on United gets its own chart in 229.
 */

import type { AwardChartProgram } from '../awardChart'

export const UNITED_CHART: AwardChartProgram = {
  charts: [
    // ─── United own-metal dynamic ──────────────────────────────────────
    {
      type: 'dynamic',
      label: 'United own-metal (dynamic)',
      partners: {
        united: {
          ranges_by_bucket: {
            'us-short':   { economy: { p10: 6000,  p50: 12500, p90: 25000 } },
            'us-medium':  { economy: { p10: 10000, p50: 22500, p90: 45000 },
                            business:{ p10: 25000, p50: 50000, p90: 100000 } },
            'us-long':    { economy: { p10: 17500, p50: 35000, p90: 70000 },
                            business:{ p10: 40000, p50: 80000, p90: 160000 } },
            'us-eu-east': { economy: { p10: 30000, p50: 60000, p90: 120000 },
                            business:{ p10: 70000, p50: 130000, p90: 250000 } },
            'us-eu-west': { economy: { p10: 30000, p50: 60000, p90: 120000 },
                            business:{ p10: 70000, p50: 130000, p90: 250000 } },
            'us-japan':   { economy: { p10: 35000, p50: 70000, p90: 140000 },
                            business:{ p10: 80000, p50: 160000, p90: 300000 } },
            'us-se-asia': { economy: { p10: 40000, p50: 80000, p90: 160000 },
                            business:{ p10: 90000, p50: 175000, p90: 320000 } },
            'us-me-india':{ economy: { p10: 40000, p50: 85000, p90: 170000 },
                            business:{ p10: 95000, p50: 180000, p90: 340000 } },
            'us-pacific': { economy: { p10: 45000, p50: 90000, p90: 180000 },
                            business:{ p10: 100000, p50: 190000, p90: 360000 } },
            'us-samerica':{ economy: { p10: 25000, p50: 50000, p90: 100000 },
                            business:{ p10: 55000, p50: 110000, p90: 220000 } },
            'us-africa':  { economy: { p10: 45000, p50: 95000, p90: 190000 },
                            business:{ p10: 105000, p50: 200000, p90: 380000 } },
          },
        },
      },
    },
    // ─── Star Alliance partner saver rates ─────────────────────────────
    // United still publishes partner saver ranges. These are MORE stable
    // than own-metal dynamic — model as zone for partners.
    {
      type: 'zone',
      label: 'United Star Alliance partners (saver)',
      partners: {
        'lufthansa': {
          matrix: {
            'us-eu-east': { economy: 33000, business: 88000, first: 121000 },
            'us-eu-west': { economy: 33000, business: 88000, first: 121000 },
            'us-me-india':{ economy: 42500, business: 105000, first: 140000 },
            'us-africa':  { economy: 45000, business: 110000 },
            'us-japan':   { economy: 40000, business: 95000 },
          },
        },
        'ana': {
          matrix: {
            'us-japan':   { economy: 35000, business: 95000, first: 110000 },
            'us-se-asia': { economy: 40000, business: 110000, first: 130000 },
          },
        },
        'singapore-airlines': {
          matrix: {
            'us-se-asia': { economy: 40000, business: 110000, first: 130000 },
          },
        },
        'turkish-airlines': {
          matrix: {
            'us-eu-east': { economy: 33000, business: 88000 },
            'us-me-india':{ economy: 42500, business: 105000 },
          },
        },
        'eva-air': {
          matrix: {
            'us-se-asia': { economy: 40000, business: 110000 },
          },
        },
        'thai-airways': {
          matrix: {
            'us-se-asia': { economy: 40000, business: 110000 },
          },
        },
        'asiana': {
          matrix: {
            'us-japan':   { economy: 35000, business: 95000 },
            'us-se-asia': { economy: 40000, business: 110000 },
          },
        },
        'air-china': {
          matrix: {
            'us-se-asia': { economy: 40000, business: 110000 },
          },
        },
        'swiss': {
          matrix: {
            'us-eu-east': { economy: 33000, business: 88000, first: 121000 },
            'us-eu-west': { economy: 33000, business: 88000 },
          },
        },
        'austrian': {
          matrix: {
            'us-eu-east': { economy: 33000, business: 88000 },
          },
        },
        'air-new-zealand': {
          matrix: {
            'us-pacific': { economy: 40000, business: 80000 },
          },
        },
      },
      overrides: [],
    },
  ],
}
