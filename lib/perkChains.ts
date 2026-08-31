/**
 * Perk chains — "tricks" where one card benefit unlocks a service that itself
 * bundles more value. Our differentiator: competitors list benefits; we chain
 * them. Each chain carries its official source + verified date so it plugs into
 * card pages and alerts later, and so we can re-verify when terms drift.
 *
 * EVERGREEN RULE: keep dollar amounts qualitative — card credits and streaming
 * bundles change constantly. The chain (what unlocks what) is durable; the exact
 * figures are not. Always confirm current terms on the issuer's page before
 * acting, which the guide states plainly.
 */
export interface PerkChain {
  id: string
  /** Punchy chain title. */
  title: string
  /** Starting card. */
  card: string
  /** Slug for /cards/[slug], when we carry the card. */
  cardSlug?: string
  /** The chain itself: each string is one link (start -> unlocks -> unlocks).
   *  When `action` is set, these are the PERKS the action unlocks (the cascade). */
  steps: string[]
  /** The one setup action to take (e.g. "link your accounts"). When present, it
   *  renders as a distinct "do this once" card above the perk cascade. */
  action?: string
  /** Optional emoji per step, same order as `steps`. Falls back to numbered nodes. */
  stepIcons?: string[]
  /** The "so what". */
  payoff: string
  /** Short source label (issuer/official only). */
  source: string
  /** YYYY-MM-DD last verified. */
  verifiedAt: string
  /** Honest catch, when there is one. */
  caveat?: string
  /** Program slugs this chain touches, so it can render on those program pages. */
  programSlugs?: string[]
}

/** Chains that involve a given program — powers the per-program "Chain Reactions" section. */
export function perkChainsForProgram(slug: string): PerkChain[] {
  return PERK_CHAINS.filter((c) => c.programSlugs?.includes(slug))
}

/** Chains that START from a given card — powers the per-card benefit-stacks section. */
export function perkChainsForCard(cardSlug: string): PerkChain[] {
  return PERK_CHAINS.filter((c) => c.cardSlug === cardSlug)
}

export const PERK_CHAINS: PerkChain[] = [
  {
    id: 'amex-plat-walmart-streaming',
    title: 'A travel card that unlocks free streaming',
    card: 'Amex Platinum',
    cardSlug: 'amex-platinum',
    steps: [
      'The Amex Platinum includes a monthly credit that covers a Walmart+ membership',
      'Walmart+ now includes your choice of Peacock or Paramount+ at no extra cost',
    ],
    payoff: 'A travel card ends up paying for a streaming service you never bought.',
    source: 'Amex + Walmart',
    verifiedAt: '2026-08-13',
    caveat: 'Choose the monthly Walmart+ plan (not annual) or the credit will not trigger, and you re-pick Peacock vs Paramount+ every 90 days.',
  },
  {
    id: 'csr-dashpass',
    title: 'A free delivery membership hiding in your travel card',
    card: 'Chase Sapphire Reserve',
    cardSlug: 'chase-sapphire-reserve',
    steps: [
      'The Chase Sapphire Reserve includes a complimentary DoorDash DashPass membership',
      'DashPass waives delivery fees and lowers service fees on eligible orders',
      'On top of that, the card adds monthly DoorDash credits toward restaurants and groceries',
    ],
    payoff: 'A paid delivery subscription plus monthly credits, just for holding the card.',
    source: 'Chase',
    verifiedAt: '2026-08-13',
    caveat: 'Activate by adding the card on DoorDash, and pay with it at checkout.',
  },
  {
    id: 'global-entry-precheck',
    title: 'One application, two Trusted Traveler programs',
    card: 'Most premium travel cards',
    steps: [
      'Many premium cards credit your Global Entry application fee',
      'Global Entry itself includes TSA PreCheck at no extra cost',
    ],
    payoff: 'One free application, faster customs AND faster security, covered by the card.',
    source: 'CBP / TSA',
    verifiedAt: '2026-08-13',
  },
  {
    id: 'amex-plat-clear-precheck',
    title: 'Buy the two fastest airport lanes for free',
    card: 'Amex Platinum',
    cardSlug: 'amex-platinum',
    steps: [
      'The Amex Platinum includes a credit that covers a CLEAR Plus membership',
      'You already get TSA PreCheck free through the Global Entry credit above',
      'Stack them: CLEAR walks you to the front of the ID line, PreCheck speeds the screening',
    ],
    payoff: 'The two fastest ways through airport security, both paid for.',
    source: 'Amex',
    verifiedAt: '2026-08-13',
  },
  {
    id: 'amex-plat-hotel-status',
    title: 'Instant hotel status at two chains, zero nights',
    card: 'Amex Platinum',
    cardSlug: 'amex-platinum',
    steps: [
      'The Amex Platinum grants complimentary Hilton Honors Gold and Marriott Bonvoy Gold (just enroll)',
      'Gold unlocks room upgrades when available, late checkout, and bonus points',
      'Hilton Gold also gives you a 5th-night-free on award stays',
    ],
    payoff: 'Mid-tier elite treatment at two hotel giants without a single qualifying stay.',
    source: 'Amex',
    verifiedAt: '2026-08-13',
    caveat: 'Most of these require a one-time enrollment in your Amex account, they do not switch on automatically.',
    programSlugs: ['hilton', 'marriott-bonvoy'],
  },
  {
    id: 'csr-ihg-hertz',
    title: 'Hotel status that climbs all the way into car-rental status',
    card: 'Chase Sapphire Reserve',
    cardSlug: 'chase-sapphire-reserve',
    steps: [
      'Just holding the Chase Sapphire Reserve grants complimentary IHG One Rewards Platinum Elite',
      'Put $75,000 of spend on the card in a year and IHG Platinum jumps to Diamond, the top tier (that same spend also unlocks World of Hyatt Explorist and Southwest A-List)',
      'IHG Diamond then hands you Hertz Gold Plus Five Star car-rental status automatically',
    ],
    payoff: 'One card turns into top-tier hotel status AND elite car-rental status.',
    source: 'Chase / IHG',
    verifiedAt: '2026-08-13',
    caveat: 'Platinum is complimentary; the jump to Diamond (and the Hertz status it carries) takes $75,000 in annual spend.',
    programSlugs: ['ihg'],
  },
  {
    id: 'venture-x-fee-funds-itself',
    title: 'A premium card whose own credits refund most of the fee',
    card: 'Capital One Venture X',
    cardSlug: 'capital-one-venture-x',
    steps: [
      'The Venture X charges an annual fee, but hands back a $300-a-year travel credit plus 10,000 anniversary miles',
      'Those two alone roughly cover the fee for most people',
      'So the Priority Pass and Capital One Lounge access you also get end up close to free',
    ],
    payoff: 'Lounge access and premium perks, largely paid for by credits you get right back.',
    source: 'Capital One',
    verifiedAt: '2026-08-13',
    caveat: 'The $300 credit only works when booking through Capital One Travel, and lounge access needs a one-time enrollment.',
  },
  {
    id: 'bilt-rent-to-travel',
    title: 'Turn rent, your biggest bill, into airline miles',
    card: 'Bilt',
    cardSlug: 'bilt-blue',
    steps: [
      'A Bilt card lets you pay rent (or a mortgage) with no transaction fee and earn Bilt rewards on it',
      'Those rewards become Bilt Points, which transfer to a long list of airline and hotel partners, including United, World of Hyatt, and Southwest',
      'And on Rent Day, the 1st of each month, you get double points on other spending plus periodic transfer bonuses',
    ],
    payoff: 'Your largest monthly expense quietly becomes flights and hotel nights.',
    source: 'Bilt',
    verifiedAt: '2026-08-13',
    caveat: 'The no-annual-fee version is the entry Bilt card; higher tiers earn more but carry a fee.',
    programSlugs: ['bilt'],
  },
  {
    id: 'amex-gold-credits-beat-fee',
    title: 'A dining card whose monthly credits outrun its fee',
    card: 'Amex Gold',
    cardSlug: 'amex-gold',
    steps: [
      'The Amex Gold stacks several credits: a monthly dining credit (Grubhub and more), plus Resy, Dunkin, and monthly Uber Cash',
      'Used across the month, those credits add up to more than the annual fee',
      'And you are still earning bonus points at restaurants and U.S. supermarkets on top',
    ],
    payoff: 'The credits can more than cover the fee before you count a single point earned.',
    source: 'Amex',
    verifiedAt: '2026-08-13',
    caveat: 'Each credit is tied to specific merchants and resets monthly or semi-annually, so you have to actually use them, and most need a one-time enrollment.',
  },
  {
    id: 'club-avolta-status-match',
    title: 'One card status, matched into hotel, car, and lounge perks',
    card: 'Any card that grants elite status',
    steps: [
      'Get mid-tier or top elite status, often free from a credit card (Marriott Gold, Hilton Diamond, IHG Platinum, and airline-card elites all count)',
      'Status-match that status to Club Avolta Platinum for free, with a quick form and a screenshot of your current status',
      'Club Avolta Platinum then carries Radisson VIP, Avis President\'s Club car-rental status, and 25 percent off Plaza Premium lounges',
    ],
    payoff: 'One status you may already hold becomes top-tier hotel status, top-tier car-rental status, and a lounge discount, all for free.',
    source: 'Club Avolta',
    verifiedAt: '2026-08-26',
    caveat: 'It is a status match, not points, and Radisson\'s US footprint is thin, so the Avis and lounge perks are the bigger draw here. Match offers come and go, so confirm it is live.',
    programSlugs: ['radisson'],
  },
  {
    id: 'finnair-radisson-partnership',
    title: 'Finnair Plus status and points, matched and converted into Radisson',
    card: 'Any Finnair Plus status (Avios can feed it)',
    steps: [
      'Hold Finnair Plus status (Silver, Gold, Platinum, or Lumo)',
      'Match it to Radisson Rewards for two years: Silver, Gold, and Platinum match to Radisson Premium; Lumo matches to Radisson VIP',
      'Separately, convert points both ways (3 Avios become 5 Radisson points; 10 Radisson points become 1 Avios) to top off whichever balance you need',
    ],
    payoff: 'Finnair status becomes Radisson hotel status, and the two currencies flow both ways for topping off an award.',
    source: 'Radisson Rewards / Finnair Plus',
    verifiedAt: '2026-08-31',
    caveat: 'The status match and conversions launched August 2026. Radisson\'s US footprint is thin, and conversions can take up to 4 to 6 weeks to post. Link accounts through the Finnair Shop portal.',
    programSlugs: ['radisson'],
  },
  {
    id: 'tmobile-delta-perks',
    title: 'Your phone plan unlocks three Delta perks',
    card: 'T-Mobile plan',
    action: 'Link your T-Mobile and Delta SkyMiles accounts (in the T-Life app for the drink, at deltastarbucks.com for Starbucks)',
    steps: [
      'Free in-flight WiFi on every Delta flight',
      'A free premium drink on qualifying Delta flights',
      'Double Starbucks Stars on days you fly Delta',
    ],
    stepIcons: ['📶', '🍸', '☕'],
    payoff: 'A phone bill you already pay turns into free WiFi, a free drink, and bonus coffee rewards on Delta.',
    source: 'Delta + T-Mobile + Starbucks',
    verifiedAt: '2026-08-27',
    caveat: 'You must link the accounts (24 hours ahead for the drink), be 21+ for the drink, and have flown Delta in the past year to keep earning Starbucks miles. Perks and eligibility can change.',
    programSlugs: ['delta'],
  },
]
