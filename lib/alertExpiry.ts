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

/**
 * Per-type freshness windows for alerts without an explicit end_date.
 * News-shaped alert types (program_change, devaluation, etc.) don't expire
 * but still shouldn't surface as a LIVE bar at the top of program pages
 * forever — readers want "what's new now," not "what changed three years
 * ago." After the window elapses, the alert still exists and shows up in
 * the alerts grid further down; it just stops being top-of-page urgent.
 *
 * Days from published_at. Tuned by perceived shelf-life of each news type.
 */
const FRESHNESS_WINDOW_DAYS: Partial<Record<string, number>> = {
  program_change:   365, // big structural change worth surfacing for a year
  partner_change:   365, // new (or removed) partner reshapes redemptions for ~a year
  category_change:  180, // hotel cat changes affect bookings for ~2 quarters
  earn_rate_change: 180,
  policy_change:    180,
  fee_change:       180,
  devaluation:       90, // urgent before, less so a quarter after it lands
  industry_news:     30, // news fades fast
}

/**
 * Effective end date for live-bar / freshness filtering. Returns the alert's
 * explicit end_date when set; otherwise computes an implicit expiry from
 * published_at + the per-type freshness window. Returns null when the alert
 * has no end_date AND no freshness window applies (treat as evergreen).
 */
export function effectiveEndMs(
  alert: {
    end_date: string | null | undefined
    type: string
    published_at: string | null | undefined
  }
): number | null {
  const explicit = effectiveExpiryMs(alert.end_date)
  if (explicit !== null) return explicit
  const days = FRESHNESS_WINDOW_DAYS[alert.type]
  if (!days) return null // evergreen
  if (!alert.published_at) return null // never published — caller decides
  const pub = new Date(alert.published_at).getTime()
  if (Number.isNaN(pub)) return null
  return pub + days * 24 * 60 * 60 * 1000
}

/**
 * Is this alert "fresh" — i.e. eligible for top-of-page LIVE bar treatment?
 * - Promo alerts (end_date set): fresh until end_date end-of-day
 * - News alerts (no end_date): fresh for `FRESHNESS_WINDOW_DAYS[type]` days
 *   after published_at
 * - Everything else (no end_date, no window match): fresh forever
 */
export function isAlertFresh(
  alert: {
    end_date: string | null | undefined
    type: string
    published_at: string | null | undefined
  },
  now: number = Date.now(),
): boolean {
  const expiresAt = effectiveEndMs(alert)
  if (expiresAt === null) return true
  return now < expiresAt
}
