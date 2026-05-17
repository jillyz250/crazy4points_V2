/**
 * Period helpers for the wallet checklist.
 *
 * Period keys are stable strings for a (frequency, date) pair:
 *   monthly:     "2026-05"
 *   quarterly:   "2026-Q2"     (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec)
 *   semi_annual: "2026-H1"     (H1=Jan-Jun, H2=Jul-Dec)
 *   annual:      "2026"
 */

import type { BenefitFrequency } from '@/utils/supabase/queries'

export type PeriodKey = string

export function periodKeyFor(frequency: BenefitFrequency | null, date: Date): PeriodKey | null {
  if (!frequency) return null
  const y = date.getFullYear()
  switch (frequency) {
    case 'monthly': {
      const m = String(date.getMonth() + 1).padStart(2, '0')
      return `${y}-${m}`
    }
    case 'quarterly': {
      const q = Math.floor(date.getMonth() / 3) + 1
      return `${y}-Q${q}`
    }
    case 'semi_annual': {
      const h = date.getMonth() < 6 ? 1 : 2
      return `${y}-H${h}`
    }
    case 'annual':
    case 'anniversary':
      return `${y}`
    default:
      return null
  }
}

export interface PeriodSlot {
  key: PeriodKey
  /** Display label (e.g., "May 2026", "Q2 2026", "H1 2026", "2026"). */
  label: string
  /** Short label for compact pills ("May", "Q2", "H1"). */
  shortLabel: string
  start: Date
  end: Date
  isCurrent: boolean
  isPast: boolean
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}
function startOfQuarter(d: Date): Date {
  return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)
}
function endOfQuarter(d: Date): Date {
  const startMonth = Math.floor(d.getMonth() / 3) * 3
  return new Date(d.getFullYear(), startMonth + 3, 0, 23, 59, 59, 999)
}
function startOfHalf(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() < 6 ? 0 : 6, 1)
}
function endOfHalf(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() < 6 ? 6 : 12, 0, 23, 59, 59, 999)
}
function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1)
}
function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
}

/** 12 monthly slots starting from current month. */
export function monthlySlots(today: Date): PeriodSlot[] {
  const out: PeriodSlot[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    out.push({
      key: periodKeyFor('monthly', d)!,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      shortLabel: MONTH_SHORT[d.getMonth()],
      start: startOfMonth(d),
      end: endOfMonth(d),
      isCurrent: i === 0,
      isPast: false,
    })
  }
  return out
}

/** 4 quarterly slots covering the next 12 months. */
export function quarterlySlots(today: Date): PeriodSlot[] {
  const out: PeriodSlot[] = []
  const start = startOfQuarter(today)
  for (let i = 0; i < 4; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i * 3, 1)
    const q = Math.floor(d.getMonth() / 3) + 1
    out.push({
      key: periodKeyFor('quarterly', d)!,
      label: `Q${q} ${d.getFullYear()}`,
      shortLabel: `Q${q}`,
      start: startOfQuarter(d),
      end: endOfQuarter(d),
      isCurrent: i === 0,
      isPast: false,
    })
  }
  return out
}

/** 2 semi-annual slots (H1 + H2) covering the next 12 months. */
export function semiAnnualSlots(today: Date): PeriodSlot[] {
  const out: PeriodSlot[] = []
  const start = startOfHalf(today)
  for (let i = 0; i < 2; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i * 6, 1)
    const h = d.getMonth() < 6 ? 1 : 2
    out.push({
      key: periodKeyFor('semi_annual', d)!,
      label: `H${h} ${d.getFullYear()}`,
      shortLabel: `H${h}`,
      start: startOfHalf(d),
      end: endOfHalf(d),
      isCurrent: i === 0,
      isPast: false,
    })
  }
  return out
}

/** Annual slot covering current calendar year (+ next, optionally). */
export function annualSlots(today: Date): PeriodSlot[] {
  const out: PeriodSlot[] = []
  for (let i = 0; i < 2; i++) {
    const d = new Date(today.getFullYear() + i, 0, 1)
    out.push({
      key: periodKeyFor('annual', d)!,
      label: `${d.getFullYear()}`,
      shortLabel: `${d.getFullYear()}`,
      start: startOfYear(d),
      end: endOfYear(d),
      isCurrent: i === 0,
      isPast: false,
    })
  }
  return out
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  const ms = date.getTime() - from.getTime()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export function formatUSD(amount: number): string {
  if (Number.isInteger(amount)) return `$${amount.toLocaleString()}`
  return `$${amount.toFixed(2)}`
}
