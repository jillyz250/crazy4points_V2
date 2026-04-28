// Pure TypeScript scoring logic — no Sanity imports, no GROQ.
// All functions accept SanityAlert and return plain numbers.

import type { SanityAlert } from './types'

const TIME_SENSITIVE_TYPES = new Set([
  'transfer_bonus',
  'limited_time_offer',
  'award_availability',
  'status_promo',
  'point_purchase',
])

const CONFIDENCE_NUMERIC: Record<string, number> = {
  low:    1,
  medium: 3,
  high:   5,
}

function daysUntil(dateStr: string): number {
  return (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
}

function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
}

function toSafeNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null
  if (typeof val !== 'number' || isNaN(val)) return null
  return val
}

// ── urgencyScore (0–5) ────────────────────────────────────────────────────────
// 0 = no endDate or expired
// 1 = >30 days  2 = 14–30  3 = 7–13  4 = 3–6  5 = ≤2 days

export function computeUrgencyScore(alert: SanityAlert): number {
  if (!alert.endDate) return 0

  const days = daysUntil(alert.endDate)
  if (days < 0) return 0   // expired → active = false
  if (days > 30) return 1
  if (days >= 14) return 2
  if (days >= 7) return 3
  if (days >= 3) return 4
  return 5                  // ≤2 days
}

// ── timeDecayFactor ──────────────────────────────────────────────────────────
// glitch:          > 48 h old → 0 (treat as expired, active = false)
// time-sensitive:  0–3 days = 1.0; after 3 days → ×0.9 per day
// structural/evergreen: ×0.98 per week

export function computeTimeDecayFactor(alert: SanityAlert): number {
  const ageDays = daysSince(alert.publishedAt)

  if (alert.type === 'glitch') {
    return ageDays > 2 ? 0 : 1
  }

  if (TIME_SENSITIVE_TYPES.has(alert.type)) {
    if (ageDays <= 3) return 1
    return Math.pow(0.9, ageDays - 3)
  }

  // Structural and Evergreen
  return Math.pow(0.98, ageDays / 7)
}

// ── finalScore ───────────────────────────────────────────────────────────────
// baseScore = (2×urgency) + (3×impact) + (3×value) + (1×rarity) + (1×confidence)
// finalScore = baseScore × timeDecayFactor
// Guards: if impactScore or valueScore is missing/invalid → return 0

export function computeFinalScore(alert: SanityAlert): number {
  const impactScore = toSafeNumber(alert.impactScore)
  const valueScore  = toSafeNumber(alert.valueScore)

  if (impactScore === null) return 0
  if (valueScore  === null) return 0

  const urgencyScore        = computeUrgencyScore(alert)
  const rarityScoreOrDefault = toSafeNumber(alert.rarityScore) ?? 3
  const confidenceNumeric   = CONFIDENCE_NUMERIC[alert.confidenceLevel] ?? 3
  const timeDecayFactor     = computeTimeDecayFactor(alert)

  const baseScore =
    2 * urgencyScore +
    3 * impactScore +
    3 * valueScore +
    1 * rarityScoreOrDefault +
    1 * confidenceNumeric

  const finalScore = baseScore * timeDecayFactor

  return isNaN(finalScore) ? 0 : finalScore
}
