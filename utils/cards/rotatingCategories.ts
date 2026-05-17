/**
 * Helpers for cards with rotating quarterly bonus categories (Chase Freedom
 * Flex, Discover It, Cap One Savor One Cash Rewards, US Bank Cash+, etc.).
 *
 * The rotating categories live in credit_card_earn_rates.notes as a free-text
 * paragraph that Sonnet writes during extraction. Format is consistent enough
 * to parse:
 *
 *   "Must activate each quarter. Q1 2026 (Jan-Mar, activate by Mar 14):
 *    Norwegian Cruise Line, Dining, American Heart Association. Q2 2026
 *    (Apr-Jun, activate by Jun 14): Amazon, Chase Travel, Feeding America.
 *    Q3 2026 (Jul-Sep, activate starting Jun 15): Coming Soon. Q4 2026
 *    (Oct-Dec, activate starting Sep 15): Coming Soon."
 *
 * This module:
 *   - Parses the notes into { q1, q2, q3, q4 } structure
 *   - Picks which quarter is "current" based on today's date
 *   - Used by the public card page banner + the refresh queue staleness check
 */

export type Quarter = 'q1' | 'q2' | 'q3' | 'q4'

export type ParsedQuarter = {
  label: string  // "Q1 2026"
  raw: string    // the original sentence
  categories: string[]  // extracted category list, e.g. ["Norwegian Cruise Line", "Dining", "American Heart Association"]
  activateBy: string | null  // "Mar 14" or null if not in the prose
  comingSoon: boolean
}

export type ParsedRotatingCategories = {
  q1: ParsedQuarter | null
  q2: ParsedQuarter | null
  q3: ParsedQuarter | null
  q4: ParsedQuarter | null
  raw: string
}

/**
 * Parse rotating_quarterly notes into a structured per-quarter map.
 * Forgiving — works on Sonnet's prose output even when phrasing varies.
 */
export function parseRotatingCategories(notes: string | null | undefined): ParsedRotatingCategories {
  const out: ParsedRotatingCategories = { q1: null, q2: null, q3: null, q4: null, raw: notes ?? '' }
  if (!notes) return out

  // Split on Q1/Q2/Q3/Q4 boundaries (case insensitive, with the year)
  const re = /(Q[1-4]\s*\d{4}[^.]*?:[^.]*\.?)/gi
  const matches = notes.match(re) ?? []
  for (const m of matches) {
    const qMatch = m.match(/Q([1-4])\s*(\d{4})/i)
    if (!qMatch) continue
    const qKey = `q${qMatch[1]}` as Quarter
    const label = `Q${qMatch[1]} ${qMatch[2]}`

    // Extract activation deadline ("activate by Mar 14")
    const actBy = m.match(/activate by\s+([A-Za-z]+ \d+)/i)
    const activateBy = actBy ? actBy[1] : null

    const comingSoon = /coming soon/i.test(m)

    // Categories: text after the colon, trimmed of trailing period
    const after = m.split(':')[1]?.trim().replace(/\.$/, '') ?? ''
    // Strip the parenthetical "(activate by X)" before splitting
    let cleanAfter = after.replace(/\(.+?\)/g, '').trim()
    if (comingSoon) cleanAfter = 'Coming Soon'
    const categories = comingSoon
      ? []
      : cleanAfter.split(/[,;]|\sand\s/).map((s) => s.trim()).filter(Boolean)

    out[qKey] = { label, raw: m, categories, activateBy, comingSoon }
  }
  return out
}

/**
 * Compute which quarter the given date falls into.
 */
export function getCurrentQuarter(date: Date = new Date()): Quarter {
  const m = date.getMonth()  // 0-indexed
  if (m < 3) return 'q1'
  if (m < 6) return 'q2'
  if (m < 9) return 'q3'
  return 'q4'
}

/**
 * For a given date, return the "first day of next quarter" — used by the
 * refresh queue to compute when a rotating-category card is next due for
 * a refresh. Adds a 14-day buffer so we don't try to re-extract on Jan 1
 * before the issuer has published the new quarter's content.
 */
export function nextQuarterRefreshDate(date: Date = new Date()): Date {
  const q = getCurrentQuarter(date)
  const year = date.getFullYear()
  const nextStart =
    q === 'q1' ? new Date(year, 3, 1)
    : q === 'q2' ? new Date(year, 6, 1)
    : q === 'q3' ? new Date(year, 9, 1)
    : new Date(year + 1, 0, 1)
  // 14-day buffer
  nextStart.setDate(nextStart.getDate() + 14)
  return nextStart
}

/**
 * Determine if a card with rotating categories is "stale due to quarter shift" —
 * was last verified in a prior quarter AND we're now past the quarter-boundary
 * buffer (14 days into the new quarter).
 */
export function isQuarterShiftStale(lastVerified: Date | string | null, now: Date = new Date()): boolean {
  if (!lastVerified) return true
  const lv = typeof lastVerified === 'string' ? new Date(lastVerified) : lastVerified
  if (Number.isNaN(lv.getTime())) return true
  const lvQuarter = getCurrentQuarter(lv)
  const lvYear = lv.getFullYear()
  const nowQuarter = getCurrentQuarter(now)
  const nowYear = now.getFullYear()
  if (lvYear === nowYear && lvQuarter === nowQuarter) return false
  // Last verified was in a different quarter — check if we're past the buffer
  // window since the new quarter started.
  const dayOfMonth = now.getDate()
  const monthInQuarter = now.getMonth() % 3
  // If we're in month 1 of a quarter, day < 14 → not yet stale (give issuers
  // time to publish new content)
  if (monthInQuarter === 0 && dayOfMonth < 14) return false
  return true
}
