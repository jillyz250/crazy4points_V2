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
