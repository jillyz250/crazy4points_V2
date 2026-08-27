/**
 * Category buckets for sweepstakes — the prize-type lens for the /sweepstakes
 * filter pills and card tints. Derived from the real running set (miles/points
 * giveaways, sports flyaways + tickets, trips, and VIP experiences). Each bucket
 * has an on-brand jewel-tone accent, matching the experiences finder's approach.
 */
export type SweepCategory = { key: string; label: string; color: string }

const RULES: { key: string; label: string; color: string; test: RegExp }[] = [
  // Currency giveaways lead — check first so "100,000 miles" isn't caught as sport.
  {
    key: 'points',
    label: 'Points & Miles',
    color: '#B8901F', // bronze/gold = currency
    test: /\b(mile|miles|point|points|aadvantage|honors|atmos|avios|skymiles|mileageplus|rapid rewards)\b|\bmillion\b|\d{2,3},000/i,
  },
  {
    key: 'trips',
    label: 'Trips & Flights',
    color: '#17868A', // teal
    test: /\b(flyaway|fly ?away|flight|flights|airfare|vacation|getaway|trip|cruise|escape|destination|hawaii|resort|hotel stay|night)\b/i,
  },
  {
    key: 'sports',
    label: 'Sports',
    color: '#2E7D5B', // emerald
    test: /\b(game|games|tickets|home game|away game|stadium|suite|courtside|match|playoff|championship|super ?bowl|nfl|nba|mlb|nhl|mls|kickoff|gameday|season)\b/i,
  },
  {
    key: 'experiences',
    label: 'Experiences',
    color: '#B03D77', // mulberry
    test: /\b(behind[- ]the[- ]scenes|vip|experience|meet|access|backstage|on[- ]field|sideline|autograph|concert|festival)\b/i,
  },
]

const OTHER: SweepCategory = { key: 'other', label: 'Other', color: '#6E6486' }

export function sweepCategory(prize: string | null | undefined, title: string | null | undefined): SweepCategory {
  const t = `${prize ?? ''} ${title ?? ''}`
  for (const r of RULES) if (r.test.test(t)) return { key: r.key, label: r.label, color: r.color }
  return OTHER
}

/** The pills shown in the filter bar, in display order. */
export const SWEEP_CATEGORY_PILLS: SweepCategory[] = RULES.map((r) => ({ key: r.key, label: r.label, color: r.color }))

/**
 * Timeshare / vacation-ownership lead-gen sweeps (Hilton Grand Vacations, Club
 * Wyndham, Westgate, Bluegreen, etc.). Their huge "2 million points" prizes are
 * bait for a timeshare presentation, so we keep them OFF the public page (they'd
 * send readers into a high-pressure funnel). Matched on ownership-specific terms
 * only — plain hotel-loyalty sweeps ("Wyndham Rewards", "Hilton Honors") stay.
 */
const TIMESHARE = /grand vacations|\bhgv\b|vacation club|vacation ownership|timeshare|club wyndham|wyndham destinations|westgate resorts|bluegreen|diamond resorts|holiday inn club|marriott vacation|vacation village|welk resorts|ownership/i
export function isTimeshareSweep(program: string | null | undefined, prize: string | null | undefined, title: string | null | undefined): boolean {
  return TIMESHARE.test(`${program ?? ''} ${prize ?? ''} ${title ?? ''}`)
}

/** Largest points/miles figure in the prize text (handles "2 million", "100,000", "50k"). */
export function sweepPrizeValue(prize: string | null | undefined, title: string | null | undefined): number {
  const t = `${prize ?? ''} ${title ?? ''}`.toLowerCase()
  let best = 0
  for (const m of t.matchAll(/([\d.]+)\s*million/g)) best = Math.max(best, Math.round(parseFloat(m[1]) * 1e6))
  for (const m of t.matchAll(/(\d{1,3}(?:,\d{3})+)/g)) best = Math.max(best, parseInt(m[1].replace(/,/g, ''), 10))
  for (const m of t.matchAll(/\b(\d{1,4})\s*k\b/g)) best = Math.max(best, parseInt(m[1], 10) * 1000)
  return best
}

/**
 * Auto-rank score for when nothing is ⭐-curated — bigger point/mile prizes lead,
 * with a nudge for currency giveaways (the audience's favourite). So the Featured
 * fallback surfaces the 2M-point / 100k-mile sweeps, not a random team flyaway.
 */
export function sweepScore(prize: string | null | undefined, title: string | null | undefined, categoryKey: string): number {
  const v = sweepPrizeValue(prize, title)
  let s = v >= 1_000_000 ? 4 : v >= 100_000 ? 3 : v >= 50_000 ? 2 : v > 0 ? 1 : 0
  if (categoryKey === 'points') s += 1
  return s
}
