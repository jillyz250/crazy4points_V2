/**
 * Network-level perks — benefits that come from the card's NETWORK (Mastercard
 * World Elite, Visa Infinite, etc.) rather than the issuer, so one definition
 * applies to every qualifying card. Sibling to lib/perkChains.ts: perk chains are
 * "A unlocks B unlocks C"; network perks are standalone benefits shared across a
 * network tier. Defining them ONCE (with the issuer source + verified date +
 * valid-through) means they render on every matching card page with no drift and
 * auto-hide when they expire, instead of being pasted into each card's notes.
 *
 * EVERGREEN RULE (same as perk chains): keep figures qualitative-ish and always
 * carry the official source + a valid-through date. Confirm current terms on the
 * network's own benefits page before relying on them.
 */
export interface NetworkPerk {
  id: string
  /** Punchy title. */
  title: string
  /** Which card network this belongs to (matches credit_cards.network). */
  network: 'mastercard' | 'visa' | 'amex' | 'discover'
  /** network_level values it applies to (matches credit_cards.network_level).
   *  Empty = applies to every card on the network regardless of level. */
  levels: string[]
  /** The benefit(s), one line each. Each line is a distinct, self-contained perk. */
  perks: string[]
  /** The "so what". */
  payoff?: string
  /** Short source label (network/issuer official only). */
  source: string
  /** Official URL for the terms. */
  sourceUrl?: string
  /** YYYY-MM-DD last verified against the source. */
  verifiedAt: string
  /** YYYY-MM-DD the offer ends; the perk is hidden after this date. Omit if evergreen. */
  validThrough?: string
  /** Honest catch. */
  caveat?: string
}

export const NETWORK_PERKS: NetworkPerk[] = [
  {
    id: 'mastercard-instacart-peacock-2026',
    title: 'Free Instacart+ and a monthly Peacock discount',
    network: 'mastercard',
    levels: ['world', 'world_elite', 'world_legend'],
    perks: [
      'Two months of free Instacart+ delivery, plus $10 off your second order each month, for new Instacart+ members who enroll by January 31, 2027.',
      '$3 off Peacock Premium every month as a statement credit when you subscribe with the card, through December 31, 2027.',
    ],
    payoff: 'Two everyday perks that ride along with the card, no annual fee attached to them.',
    source: 'Mastercard World Elite benefits',
    sourceUrl: 'https://www.mastercard.com/us/en/personal/find-a-card/credit-card/world-elite-mastercard.html',
    verifiedAt: '2026-08-28',
    validThrough: '2027-12-31',
    caveat: 'Both are for new subscribers only, and Peacock arrives as a monthly statement credit, not a free subscription. These are two separate perks, not a bundle.',
  },
]

/**
 * Network perks that apply to a given card, filtered by network + level and
 * dropping any past their valid-through date. `today` defaults to now (pass it
 * explicitly from a caller that needs determinism).
 */
export function networkPerksForCard(
  network: string | null | undefined,
  level: string | null | undefined,
  today: string = new Date().toISOString().slice(0, 10),
): NetworkPerk[] {
  if (!network) return []
  const net = network.toLowerCase()
  const lvl = (level ?? '').toLowerCase()
  return NETWORK_PERKS.filter((p) => {
    if (p.network !== net) return false
    if (p.levels.length > 0 && !p.levels.includes(lvl)) return false
    if (p.validThrough && p.validThrough < today) return false
    return true
  })
}
