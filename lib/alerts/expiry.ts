/**
 * Alert expiry semantics: end_date is treated as a CALENDAR DATE in
 * America/New_York. An alert with end_date = "May 1" stays active through
 * the end of May 1 in ET, then disappears at midnight ET on May 2.
 *
 * Why ET (not UTC, not user's local TZ): editorial / business calendar.
 * Promotions are advertised in US Eastern terms. A naïve UTC compare cuts
 * an alert off mid-day for ET users.
 *
 * The DB filter uses a permissive 36h grace window so any alert that COULD
 * still be valid in ET makes it back from Postgres; this helper then runs
 * the strict ET-based check.
 */

const TZ = 'America/New_York'

/**
 * Returns the UTC ISO timestamp at which an alert with the given end_date
 * stops being active. Equals midnight ET on the day AFTER end_date's
 * UTC calendar day.
 *
 * Why UTC date (not ET date) of end_date: when an admin form uses an
 * `<input type="date">` for end_date, the value is stored as midnight UTC
 * of that date (e.g. typing "May 1" yields 2026-05-01T00:00:00Z). If we
 * treated that as "ET calendar day," it would shift to April 30 ET and
 * the alert would already be expired on May 1. Using the UTC date matches
 * the admin's intent: "expires May 1" = visible through end of May 1 ET.
 *
 * Examples:
 *   end_date = 2026-05-01T00:00:00Z  → UTC day = 2026-05-01
 *     → expires at midnight ET May 2 → 2026-05-02T04:00:00Z (EDT)
 *
 *   end_date = 2026-05-01T23:59:59Z  → UTC day = 2026-05-01
 *     → expires at midnight ET May 2 → 2026-05-02T04:00:00Z (EDT)
 *
 *   end_date = 2026-04-30T23:00:00Z  → UTC day = 2026-04-30
 *     → expires at midnight ET May 1 → 2026-05-01T04:00:00Z (EDT)
 *
 * Handles DST: probes the ET offset (EDT -4 vs EST -5) for the relevant
 * day before constructing the cutoff.
 */
export function alertExpiryInstantUTC(endDate: string): Date {
  const end = new Date(endDate)
  const y = end.getUTCFullYear()
  const m = end.getUTCMonth() + 1 // 1-indexed for parity with strings
  const d = end.getUTCDate()

  // Probe noon UTC on the NEXT day, then read what hour that is in ET.
  // EDT (-4): 12:00 UTC = 8:00 ET → offset 4 hours west
  // EST (-5): 12:00 UTC = 7:00 ET → offset 5 hours west
  const probeUTC = Date.UTC(y, m - 1, d + 1, 12, 0, 0)
  const localHourStr = new Date(probeUTC).toLocaleString('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    hour12: false,
  })
  const localHour = parseInt(localHourStr, 10)
  const offsetHoursWest = 12 - localHour // 4 (EDT) or 5 (EST)

  // Midnight ET on next ET day == (offsetHoursWest) hours UTC on next day
  return new Date(Date.UTC(y, m - 1, d + 1, offsetHoursWest))
}

/** True if the alert is still active in ET right now. Null end_date = always active. */
export function isAlertActiveET(endDate: string | null, nowMs: number = Date.now()): boolean {
  if (!endDate) return true
  return nowMs < alertExpiryInstantUTC(endDate).getTime()
}

/**
 * Returns a UTC ISO timestamp 36 hours before now. Use as the lower bound
 * for the SQL filter — anything with end_date >= this could still be active
 * in ET; the JS helper does the strict check after fetch.
 */
export function permissiveActiveCutoffISO(nowMs: number = Date.now()): string {
  return new Date(nowMs - 36 * 60 * 60 * 1000).toISOString()
}
