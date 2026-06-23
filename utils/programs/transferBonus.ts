/**
 * Self-expiring transfer-bonus logic.
 *
 * Transfer-bonus badges are driven by `bonus_active` on each
 * `transfer_partners_outbound` row. Without an end date, a flag stays "on"
 * until someone manually turns it off — so promos silently go stale (we caught
 * Citi->iPrefer and Citi->Wyndham both live in the data weeks after they ended).
 *
 * The fix: an optional `bonus_end_date` (YYYY-MM-DD) on the row, and this single
 * predicate used at EVERY read site (program-page badge, card page, Decision
 * Engine earn paths, newsletter + AI context). A bonus with a past end date
 * renders as inactive automatically — no cron, no per-bonus reminder. A flag
 * with no end date behaves exactly as before (always-on until cleared).
 *
 * Day-granularity, UTC: a bonus is live through the end of its `bonus_end_date`.
 * ISO date strings compare correctly with `<=` lexicographically.
 */

export interface BonusFlagRow {
  bonus_active?: boolean | null
  bonus_end_date?: string | null
}

/** Today's date as an ISO day string (YYYY-MM-DD), UTC. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Is this transfer-partner row's bonus live right now? True only when the flag
 * is set AND (no end date OR the end date hasn't passed). Pass `today` to make
 * it deterministic in tests.
 */
export function isBonusActive(row: BonusFlagRow | null | undefined, today: string = todayISO()): boolean {
  if (!row || row.bonus_active !== true) return false
  if (!row.bonus_end_date) return true
  return row.bonus_end_date >= today
}

/**
 * Days until a row's bonus ends (0 = ends today, negative = already past).
 * Returns null when there's no active flag or no end date. Used by the
 * data-integrity sweep to surface "expiring soon" + "past end date" flags.
 */
export function bonusDaysRemaining(row: BonusFlagRow | null | undefined, today: string = todayISO()): number | null {
  if (!row || row.bonus_active !== true || !row.bonus_end_date) return null
  const ms = Date.parse(row.bonus_end_date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')
  return Math.round(ms / 86_400_000)
}
