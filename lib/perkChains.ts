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
  /** The chain itself: each string is one link (start -> unlocks -> unlocks). */
  steps: string[]
  /** The "so what". */
  payoff: string
  /** Short source label (issuer/official only). */
  source: string
  /** YYYY-MM-DD last verified. */
  verifiedAt: string
  /** Honest catch, when there is one. */
  caveat?: string
}

export const PERK_CHAINS: PerkChain[] = [
  {
    id: 'amex-plat-walmart-streaming',
    title: 'A travel card that quietly hands you free streaming',
    card: 'Amex Platinum',
    cardSlug: 'amex-platinum',
    steps: [
      'The Amex Platinum includes a monthly credit that covers a Walmart+ membership',
      'Walmart+ now includes your choice of Peacock or Paramount+ at no extra cost',
      'So a travel card ends up paying for a streaming service you never bought',
    ],
    payoff: 'Free streaming, funded by a credit you already have.',
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
      'So one free application gets you faster customs AND faster security',
    ],
    payoff: 'Skip lines at the border and at the checkpoint, all covered by the card.',
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
      'A Bilt card lets you pay rent (or a mortgage) with no transaction fee and earn points on it',
      'Those points transfer to a long list of airline and hotel partners, including United, World of Hyatt, and Southwest',
      'And on Rent Day, the 1st of each month, you get double points on other spending plus periodic transfer bonuses',
    ],
    payoff: 'Your largest monthly expense quietly becomes flights and hotel nights.',
    source: 'Bilt',
    verifiedAt: '2026-08-13',
    caveat: 'The no-annual-fee version is the entry Bilt card; higher tiers earn more but carry a fee.',
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
]
