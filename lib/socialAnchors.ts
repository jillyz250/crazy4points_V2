/**
 * Recurring social-calendar anchors — the predictable points-world dates that
 * auto-fill the content calendar so Jill can plan far ahead (Bilt Rent Day, Chase
 * and Discover quarterly categories, etc.). Add an anchor here and the generator
 * (app/api/cron/social-calendar + scripts) rolls it forward into `social_calendar`
 * as `suggested` rows. Extensible by design; a self-serve anchor admin can come
 * later. Reviewed with Copilot 2026-09-01.
 */
export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok'

export type SocialAnchor = {
  key: string //  stable id, used as source_ref for idempotency (never reuse)
  topic: string //  human-readable calendar label
  cadence: 'monthly' | 'quarterly'
  dayOfMonth: number //  the event day (Bilt Rent Day = 1)
  months?: number[] //  quarterly only: 1-based months, e.g. [1,4,7,10]
  leadDays: number //  post this many calendar days BEFORE the event
  platforms: SocialPlatform[]
  linkUrl?: string
  note?: string //  seeds the row's notes so the draft has context
}

export const SOCIAL_ANCHORS: SocialAnchor[] = [
  {
    key: 'bilt-rent-day',
    topic: 'Bilt Rent Day',
    cadence: 'monthly',
    dayOfMonth: 1,
    leadDays: 2, //  heads-up a couple days before the 1st
    platforms: ['facebook', 'instagram'],
    note: 'Rent Day is the 1st: Bilt doubles non-rent points and often runs a transfer bonus. Post the heads-up so people use it.',
  },
  {
    key: 'chase-freedom-quarterly',
    topic: 'Chase Freedom 5% quarterly categories',
    cadence: 'quarterly',
    months: [1, 4, 7, 10],
    dayOfMonth: 1,
    leadDays: 0, //  activation reminder at quarter start
    platforms: ['facebook', 'instagram'],
    note: 'New 5% bonus categories are live this quarter on Chase Freedom / Freedom Flex. Remind cardholders to activate (verify the actual categories vs Chase before posting).',
  },
  {
    key: 'discover-quarterly',
    topic: 'Discover it 5% quarterly categories',
    cadence: 'quarterly',
    months: [1, 4, 7, 10],
    dayOfMonth: 1,
    leadDays: 0,
    platforms: ['facebook', 'instagram'],
    note: 'New Discover it 5% quarterly categories are live. Activation reminder (verify categories vs Discover before posting).',
  },
]

/** A generated slot, ready to upsert into social_calendar. */
export type AnchorSlot = {
  post_date: string //  YYYY-MM-DD
  platform: SocialPlatform
  topic: string
  source_type: 'recurring'
  source_ref: string
  status: 'suggested'
  link_url: string | null
  notes: string | null
}

// Date-only helpers (UTC math, no locale/timezone drift on the date arithmetic).
function ymd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}
function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setUTCDate(c.getUTCDate() + n)
  return c
}

/**
 * Every anchor occurrence whose POST date falls in [fromISO, toISO], expanded per
 * platform. `todayISO` is passed in (not read from the clock) so it is testable
 * and cron-safe. Iterates months across the window and, for quarterly anchors,
 * keeps only the configured months.
 */
export function generateAnchorSlots(fromISO: string, toISO: string): AnchorSlot[] {
  const from = new Date(`${fromISO}T00:00:00Z`)
  const to = new Date(`${toISO}T00:00:00Z`)
  const slots: AnchorSlot[] = []

  for (const a of SOCIAL_ANCHORS) {
    // Walk each month from a bit before `from` (leadDays can push a post into the
    // previous month) through `to`.
    const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - 1, 1))
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() + 1, 1))
    for (let m = new Date(start); m <= end; m.setUTCMonth(m.getUTCMonth() + 1)) {
      const month1 = m.getUTCMonth() + 1 // 1-based
      if (a.cadence === 'quarterly' && !(a.months ?? []).includes(month1)) continue
      const eventDate = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), a.dayOfMonth))
      const postDate = addDays(eventDate, -a.leadDays)
      if (postDate < from || postDate > to) continue
      for (const platform of a.platforms) {
        slots.push({
          post_date: ymd(postDate),
          platform,
          topic: a.topic,
          source_type: 'recurring',
          source_ref: a.key,
          status: 'suggested',
          link_url: a.linkUrl ?? null,
          notes: a.note ?? null,
        })
      }
    }
  }
  return slots
}
