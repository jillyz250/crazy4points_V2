/**
 * Atmos Rewards (formerly Alaska MileagePlan) — structured award chart
 *
 * Phase 2 batch 1 / Award Chart Rebuild (Option C).
 * Source: alaskaair.com/account/mileage-plan/redeem-miles partner pages.
 *
 * Atmos preserved the famous Alaska distance-based partner chart, which
 * is THE reason this program is a sweet-spot favorite. Each partner has
 * its own distance bands; bands roughly map to route geography (US to N
 * Asia ≠ US to S Asia ≠ US to ME etc.). We model the high-impact partner
 * sweet spots in batch 1; remaining smaller partners come in batch 2.
 *
 * Confidence: HIGH on Cathay / JAL / Qantas / Fiji / Etihad (well-documented
 * sweet spots); MED on BA / Iberia / Korean (less stable rates).
 */

import type { AwardChartProgram } from '../awardChart'

export const ATMOS_CHART: AwardChartProgram = {
  charts: [
    // ─── Cathay Pacific — famous US-Asia sweet spot ─────────────────────
    {
      type: 'distance',
      label: 'Atmos — Cathay Pacific',
      partners: {
        cathay: {
          bands: [
            { max_miles: 5000,  cabin: { economy: 30000, premium_economy: 47500, business: 50000, first: 70000 } },
            { max_miles: 12000, cabin: { economy: 35000, premium_economy: 55000, business: 65000, first: 75000 } },
          ],
        },
      },
    },
    // ─── JAL — clean Asia partner ───────────────────────────────────────
    {
      type: 'distance',
      label: 'Atmos — JAL',
      partners: {
        jal: {
          bands: [
            { max_miles: 7000,  cabin: { economy: 35000, premium_economy: 45000, business: 65000, first: 75000 } },
            { max_miles: 12000, cabin: { economy: 40000, premium_economy: 55000, business: 75000, first: 95000 } },
          ],
        },
      },
    },
    // ─── Qantas — US-Australia/NZ sweet spot ────────────────────────────
    {
      type: 'distance',
      label: 'Atmos — Qantas',
      partners: {
        qantas: {
          bands: [
            { max_miles: 7000,  cabin: { economy: 40000, premium_economy: 55000, business: 55000, first: 70000 } },
            { max_miles: 12000, cabin: { economy: 50000, premium_economy: 65000, business: 70000, first: 85000 } },
          ],
        },
      },
    },
    // ─── Fiji Airways — US-Pacific ──────────────────────────────────────
    {
      type: 'distance',
      label: 'Atmos — Fiji Airways',
      partners: {
        'fiji-airways': {
          bands: [
            { max_miles: 7000,  cabin: { economy: 40000, business: 55000, first: 70000 } },
          ],
        },
      },
    },
    // ─── Etihad — US-Middle East / India sweet spot ─────────────────────
    {
      type: 'distance',
      label: 'Atmos — Etihad',
      partners: {
        etihad: {
          bands: [
            { max_miles: 7000,  cabin: { economy: 30000, business: 55000, first: 75000 } },
            { max_miles: 12000, cabin: { economy: 35000, business: 65000, first: 90000 } },
          ],
        },
      },
    },
    // ─── Korean Air ─────────────────────────────────────────────────────
    {
      type: 'distance',
      label: 'Atmos — Korean Air',
      partners: {
        'korean-air': {
          bands: [
            { max_miles: 7000,  cabin: { economy: 30000, business: 60000, first: 80000 } },
            { max_miles: 12000, cabin: { economy: 35000, business: 70000, first: 95000 } },
          ],
        },
      },
    },
    // ─── British Airways (high YQ — surface in narrative) ────────────────
    {
      type: 'distance',
      label: 'Atmos — British Airways',
      partners: {
        'british-airways': {
          bands: [
            { max_miles: 5000,  cabin: { economy: 30000, business: 50000, first: 70000 } },
            { max_miles: 12000, cabin: { economy: 40000, business: 65000, first: 85000 } },
          ],
        },
      },
    },
    // ─── Iberia ─────────────────────────────────────────────────────────
    {
      type: 'distance',
      label: 'Atmos — Iberia',
      partners: {
        iberia: {
          bands: [
            { max_miles: 5000,  cabin: { economy: 30000, business: 55000 } },
          ],
        },
      },
    },
    // ─── Aer Lingus ─────────────────────────────────────────────────────
    {
      type: 'distance',
      label: 'Atmos — Aer Lingus',
      partners: {
        'aer-lingus': {
          bands: [
            { max_miles: 5000,  cabin: { economy: 25000, business: 50000 } },
          ],
        },
      },
    },
    // ─── American Airlines (Atmos bilateral) ────────────────────────────
    {
      type: 'distance',
      label: 'Atmos — American Airlines',
      partners: {
        aa: {
          bands: [
            { max_miles: 700,  cabin: { economy: 7500,  business: 25000 } },
            { max_miles: 6000, cabin: { economy: 12500, business: 25000, first: 50000 } },
          ],
        },
      },
    },
    // ─── Alaska + Hawaiian (own metal) ──────────────────────────────────
    {
      type: 'distance',
      label: 'Atmos — own metal',
      partners: {
        alaska: {
          bands: [
            { max_miles: 700,  cabin: { economy: 5000,  business: 15000 } },
            { max_miles: 2100, cabin: { economy: 12500, business: 25000 } },
            { max_miles: 6000, cabin: { economy: 25000, business: 45000 } },
          ],
        },
        hawaiian: {
          bands: [
            { max_miles: 700,  cabin: { economy: 5000,  business: 15000 } },
            { max_miles: 6000, cabin: { economy: 22500, business: 45000 } },
          ],
        },
      },
    },
  ],
}
