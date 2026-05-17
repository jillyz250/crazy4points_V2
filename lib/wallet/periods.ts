/**
 * Period helpers for the wallet checklist.
 *
 * Each tracked benefit has a frequency: monthly / quarterly / annual. The
 * checklist UI lets users mark each benefit's "use" status per period, then
 * automatically re-presents it when the next period starts.
 *
 * A "period key" is a stable string for a (frequency, date) pair:
 *   monthly:   "2026-05"
 *   quarterly: "2026-Q2"  (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec)
 *   annual:    "2026"
 *
 * Storage shape (localStorage):
 *   {
 *     selectedCards: ["chase-ink-business-preferred", "amex-gold", ...],
 *     usage: {
 *       "<benefit_id>": {
 *         "2026-05": "2026-05-12T14:23:00Z",   // monthly key → ISO timestamp
 *         "2026-Q2": "2026-04-08T..."          // quarterly key → ISO timestamp
 *       }
 *     },
 *     certExpirations: {
 *       "<benefit_id>": "2026-10-15"           // YYYY-MM-DD for free-night certs
 *     }
 *   }
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
    case 'annual':
    case 'anniversary': // treat as annual for v0
      return `${y}`
    default:
      return null
  }
}

/**
 * Periods to display in the 12-month checklist, anchored to today.
 * For each frequency, returns the list of period keys covering the next 12
 * months — monthly gets 12 entries, quarterly gets 4, annual gets 1-2.
 */
export interface PeriodSlot {
  key: PeriodKey
  /** Display label for the period (e.g., "May 2026", "Q2 2026", "2026"). */
  label: string
  /** First day of the period (used for sort / "current" detection). */
  start: Date
  /** Last day of the period (used to show expiration / countdown). */
  end: Date
  /** True if today falls within this period. */
  isCurrent: boolean
  /** True if the period has already ended. */
  isPast: boolean
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
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
function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1)
}
function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
}

/** Returns 12 monthly period slots starting from current month. */
export function monthlySlots(today: Date): PeriodSlot[] {
  const out: PeriodSlot[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const start = startOfMonth(d)
    const end = endOfMonth(d)
    out.push({
      key: periodKeyFor('monthly', d)!,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      start,
      end,
      isCurrent: i === 0,
      isPast: false,
    })
  }
  return out
}

/** Returns quarterly slots covering the next 12 months (4 slots). */
export function quarterlySlots(today: Date): PeriodSlot[] {
  const out: PeriodSlot[] = []
  const currentQStart = startOfQuarter(today)
  for (let i = 0; i < 4; i++) {
    const d = new Date(currentQStart.getFullYear(), currentQStart.getMonth() + i * 3, 1)
    const start = startOfQuarter(d)
    const end = endOfQuarter(d)
    const q = Math.floor(d.getMonth() / 3) + 1
    out.push({
      key: periodKeyFor('quarterly', d)!,
      label: `Q${q} ${d.getFullYear()}`,
      start,
      end,
      isCurrent: i === 0,
      isPast: false,
    })
  }
  return out
}

/** Returns annual slot(s) covering the next 12 months (1 or 2). */
export function annualSlots(today: Date): PeriodSlot[] {
  const out: PeriodSlot[] = []
  for (let i = 0; i < 2; i++) {
    const d = new Date(today.getFullYear() + i, 0, 1)
    out.push({
      key: periodKeyFor('annual', d)!,
      label: `${d.getFullYear()}`,
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

export function formatValue(amount: number | null, unit: string | null): string {
  if (amount == null) return ''
  if (unit === 'USD') return `$${amount.toLocaleString()}`
  if (unit === 'pct') return `${amount}%`
  if (unit === 'nights') return `${amount} night${amount === 1 ? '' : 's'}`
  if (unit === 'points' || unit === 'miles') return `${amount.toLocaleString()} ${unit}`
  return `${amount}`
}
