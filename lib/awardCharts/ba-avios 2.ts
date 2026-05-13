/**
 * British Airways Executive Club (Avios) — structured award chart
 *
 * Phase 2 batch 1 / Award Chart Rebuild (Option C).
 * Source: ba.com/en-us/executive-club/spending-avios — published distance-
 * based Reward Flight chart with peak/off-peak.
 *
 * BA Avios is the pilot's reference shape — distance_plus_modifiers with:
 *   - distance bands per partner (BA / Qatar / Iberia all share the base)
 *   - peak/off-peak calendar (chart-level, BA standard)
 *   - RFS caps for cash co-pay (us-eu-east + intra-Europe)
 *   - route overrides (the famous off-peak unicorns)
 *
 * Confidence: HIGH on BA own-metal bands (most documented chart in the
 * Avios family); MED on Iberia/Qatar override behavior.
 *
 * NOTE: This program's slug in the DB is 'british-airways' (the carrier
 * row also serves as the currency row). Per audit decision #1, future
 * slug-cleanup may add a dedicated 'ba-avios' currency row; for now we
 * author on british-airways.
 */

import type { AwardChartProgram } from '../awardChart'

const BA_PEAK_CALENDAR = [
  // Standard BA peak windows (Easter, summer, Christmas/NY)
  { start: '2026-04-03', end: '2026-04-18' },     // Easter
  { start: '2026-05-22', end: '2026-09-01' },     // Summer
  { start: '2026-12-15', end: '2027-01-05' },     // Christmas/NY
  { start: '2027-04-02', end: '2027-04-17' },     // Easter '27
  { start: '2027-05-22', end: '2027-09-01' },     // Summer '27
]

export const BA_AVIOS_CHART: AwardChartProgram = {
  charts: [
    {
      type: 'distance_plus_modifiers',
      label: 'BA Avios — Reward Flights',
      peak_calendar: BA_PEAK_CALENDAR,
      rfs_caps: {
        // RFS cash co-pay caps (USD-approximated; BA publishes in GBP).
        // Intra-Europe RFS exists too but our RouteBucket type doesn't model
        // intra-Europe yet — add when needed.
        economy:  { 'us-eu-east': 175, 'us-eu-west': 200 },
        business: { 'us-eu-east': 550, 'us-eu-west': 600 },
      },
      partners: {
        // BA own-metal — full distance chart
        'british-airways': {
          bands: [
            { max_miles: 650,
              peak:     { economy: 7750,  business: 18000 },
              off_peak: { economy: 6000,  business: 13500 } },
            { max_miles: 1150,
              peak:     { economy: 10500, business: 25000 },
              off_peak: { economy: 8500,  business: 20000 } },
            { max_miles: 2000,
              peak:     { economy: 13000, business: 38500 },
              off_peak: { economy: 11000, business: 32000 } },
            { max_miles: 3000,
              peak:     { economy: 22000, business: 56500, first: 87000 },
              off_peak: { economy: 17000, business: 47000, first: 72500 } },
            { max_miles: 4000,
              peak:     { economy: 26000, business: 62500, first: 100000 },
              off_peak: { economy: 21000, business: 50000, first: 85000 } },
            { max_miles: 5500,
              peak:     { economy: 32500, business: 77500, first: 125000 },
              off_peak: { economy: 25750, business: 62500, first: 100000 } },
            { max_miles: 6500,
              peak:     { economy: 39000, business: 95000, first: 156000 },
              off_peak: { economy: 32500, business: 77500, first: 125000 } },
            { max_miles: 7000,
              peak:     { economy: 50000, business: 110000, first: 175000 },
              off_peak: { economy: 40000, business: 90000, first: 145000 } },
          ],
        },
        // Qatar Airways — same bands as BA; Qatar passes through cleanly
        'qatar': {
          bands: [
            { max_miles: 2000,
              peak:     { economy: 13000, business: 38500 },
              off_peak: { economy: 11000, business: 32000 } },
            { max_miles: 4000,
              peak:     { economy: 26000, business: 62500 },
              off_peak: { economy: 21000, business: 50000 } },
            { max_miles: 7000,
              peak:     { economy: 50000, business: 110000 },
              off_peak: { economy: 40000, business: 90000 } },
          ],
        },
        // Iberia — different short-haul off-peak rates
        'iberia': {
          bands: [
            { max_miles: 650,
              peak:     { economy: 7750,  business: 18000 },
              off_peak: { economy: 4500,  business: 10000 } },
            { max_miles: 2000,
              peak:     { economy: 13000, business: 38500 },
              off_peak: { economy: 9000,  business: 27000 } },
            { max_miles: 4000,
              peak:     { economy: 26000, business: 62500 },
              off_peak: { economy: 17000, business: 34000 } },
            { max_miles: 7000,
              peak:     { economy: 50000, business: 110000 },
              off_peak: { economy: 34000, business: 68000 } },
          ],
        },
        // American Airlines on Avios — distance-based
        'aa': {
          bands: [
            { max_miles: 500,
              peak:     { economy: 7500 },
              off_peak: { economy: 7500 } },
            { max_miles: 1000,
              peak:     { economy: 10000 },
              off_peak: { economy: 10000 } },
            { max_miles: 2000,
              peak:     { economy: 15000 },
              off_peak: { economy: 15000 } },
          ],
        },
        // JAL on Avios — distance-based
        'jal': {
          bands: [
            { max_miles: 5500,
              peak:     { economy: 32500, business: 77500 },
              off_peak: { economy: 25750, business: 62500 } },
            { max_miles: 7000,
              peak:     { economy: 50000, business: 110000 },
              off_peak: { economy: 40000, business: 90000 } },
          ],
        },
      },
      overrides: [
        // The famous MAD-JFK J off-peak unicorn (Iberia)
        { from: 'MAD', to: 'JFK', bidirectional: true, cabin: 'business',
          season: 'off_peak', miles: 34000,
          note: 'Iberia Plus off-peak MAD-JFK — classic Avios sweet spot' },
        // BCN-JFK same Iberia off-peak rate
        { from: 'BCN', to: 'JFK', bidirectional: true, cabin: 'business',
          season: 'off_peak', miles: 34000,
          note: 'Iberia off-peak BCN-JFK' },
      ],
    },
  ],
}
