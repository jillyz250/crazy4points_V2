import type { AlertWithPrograms } from '@/utils/supabase/queries'

export type AlertTier = 'hero' | 'grid' | 'condensed'

export interface TieredAlerts {
  hero: AlertWithPrograms[]
  grid: AlertWithPrograms[]
  condensed: AlertWithPrograms[]
}

const HERO_MAX = 3
const GRID_MAX = 12
const HOT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const ENDING_SOON_MS = 7 * 24 * 60 * 60 * 1000
const HERO_IMPACT_MIN = 8
const GRID_IMPACT_MIN = 5

function publishedWithin(alert: AlertWithPrograms, windowMs: number): boolean {
  if (!alert.published_at) return false
  return Date.now() - new Date(alert.published_at).getTime() <= windowMs
}

function endingSoon(alert: AlertWithPrograms): boolean {
  if (!alert.end_date) return false
  const left = new Date(alert.end_date).getTime() - Date.now()
  return left > 0 && left <= ENDING_SOON_MS
}

function isHero(alert: AlertWithPrograms): boolean {
  if (alert.is_hot) return true
  return alert.impact_score >= HERO_IMPACT_MIN && publishedWithin(alert, HOT_WINDOW_MS)
}

function isGrid(alert: AlertWithPrograms): boolean {
  return alert.impact_score >= GRID_IMPACT_MIN || endingSoon(alert)
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
