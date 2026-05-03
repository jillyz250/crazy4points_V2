// Shared expiry math for alerts. Single source of truth so the program page,
// alert detail page, and various alert cards all behave the same way.
//
// Convention: an alert with end_date "2026-05-03" stays ACTIVE through the
// entire calendar day of May 3, regardless of timezone. Promotions almost
// always say "ends [date]" meaning end-of-day, not start-of-day. Storing
// midnight-UTC and comparing raw timestamps was flipping alerts to "Expired"
// the moment May 3 began in any timezone east of UTC, before the user even
// woke up on the day the offer was supposedly still good.
//
// Implementation: treat end_date as INCLUSIVE end-of-day. The effective
// expiry timestamp = end_date + 24 hours. Anything before that = active.

/**
 * Effective expiry timestamp for comparison. Returns null when end_date
 * is null/invalid (alert is evergreen). Adds 24h to the parsed end_date
 * so the entire calendar day is treated as active.
 */
export function effectiveExpiryMs(endDate: string | null | undefined): number | null {
  if (!endDate) return null
  const t = new Date(endDate).getTime()
  if (Number.isNaN(t)) return null
  return t + 24 * 60 * 60 * 1000
}

/**
 * Is this alert still active at `now`?
 * - end_date null → always active (evergreen)
 * - end_date in future (after end-of-day) → active
 * - else → expired
 */
export function isAlertActive(
  endDate: string | null | undefined,
  now: number = Date.now(),
): boolean {
  const expiresAt = effectiveExpiryMs(endDate)
  if (expiresAt === null) return true
  return now < expiresAt
}

/**
 * Days remaining until end-of-day on end_date, ceiling-rounded.
 * - 0 = expires today
 * - 1 = expires tomorrow
 * - negative = already expired
 * Returns null when end_date is null/invalid.
 */
export function daysUntilEndOfDay(
  endDate: string | null | undefined,
  now: number = Date.now(),
): number | null {
  const expiresAt = effectiveExpiryMs(endDate)
  if (expiresAt === null) return null
  return Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) - 1
}

/**
 * Human label like "Expires today" / "Expires tomorrow" / "Expires in 5 days"
 * / "Expires May 3" / "Expired". Returns null when end_date is null.
 */
export function formatExpiryLabel(endDate: string | null | undefined): string | null {
  if (!endDate) return null
  const days = daysUntilEndOfDay(endDate)
  if (days === null) return null
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  if (days <= 7) return `Expires in ${days} days`
  const end = new Date(endDate)
  return `Expires ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}
