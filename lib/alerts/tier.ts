import type { AlertWithPrograms } from '@/utils/supabase/queries'

export type AlertTier = 'hero' | 'grid' | 'condensed'

export interface TieredAlerts {
  hero: AlertWithPrograms[]
  grid: AlertWithPrograms[]
  condensed: AlertWithPrograms[]
}

// Tiering policy (revised 2026-05-12 design pass):
//
// The OLD rules let a "good but not urgent" alert sit in the Top
// bucket while an alert ending TOMORROW landed below it in More Alerts.
// Urgency color hierarchy (red → green) and bucket hierarchy
// (Top → More → Also) didn't agree, so the page read chaotic.
//
// New rule: bucket order MUST match urgency order. Urgent alerts
// (≤7 days left) ALWAYS land in Top, even if their impact is modest —
// urgency itself is the editorial signal.
//
// Top Alerts:    ends ≤7 days  OR  is_hot=true  OR  impact ≥ 8
// More Alerts:   ends ≤30 days  OR  impact ≥ 5
// Also Active:   everything else
//
// HERO_MAX bumped 3 → 4 so a busy week with 4 urgent alerts still
// fits up top. If more than 4 are urgent, the overflow falls to More.

const HERO_MAX = 4
const GRID_MAX = 12
const URGENT_MS = 7 * 24 * 60 * 60 * 1000
const NEAR_TERM_MS = 30 * 24 * 60 * 60 * 1000
const HERO_IMPACT_MIN = 8
const GRID_IMPACT_MIN = 5

function daysLeftMs(alert: AlertWithPrograms): number | null {
  if (!alert.end_date) return null
  return new Date(alert.end_date).getTime() - Date.now()
}

function isUrgent(alert: AlertWithPrograms): boolean {
  const ms = daysLeftMs(alert)
  return ms !== null && ms > 0 && ms <= URGENT_MS
}

function isNearTerm(alert: AlertWithPrograms): boolean {
  const ms = daysLeftMs(alert)
  return ms !== null && ms > 0 && ms <= NEAR_TERM_MS
}

function isHero(alert: AlertWithPrograms): boolean {
  if (isUrgent(alert)) return true
  if (alert.is_hot) return true
  return alert.impact_score >= HERO_IMPACT_MIN
}

function isGrid(alert: AlertWithPrograms): boolean {
  return alert.impact_score >= GRID_IMPACT_MIN || isNearTerm(alert)
}

// Partitions alerts into three display tiers by editorial importance.
// Input is already sorted by the caller (getActiveAlerts sort).
export function tierAlerts(alerts: AlertWithPrograms[]): TieredAlerts {
  const hero: AlertWithPrograms[] = []
  const grid: AlertWithPrograms[] = []
  const condensed: AlertWithPrograms[] = []

  for (const a of alerts) {
    if (hero.length < HERO_MAX && isHero(a)) {
      hero.push(a)
    } else if (grid.length < GRID_MAX && isGrid(a)) {
      grid.push(a)
    } else {
      condensed.push(a)
    }
  }

  return { hero, grid, condensed }
}
