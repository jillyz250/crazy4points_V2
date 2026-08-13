/**
 * Guides registry — single source of truth for the editorial guide library.
 *
 * The /guides hub, the header nav, and program-page "related guide" callouts
 * all read from this list. Adding a guide = add one entry here + create the
 * page at app/(site)/guides/<slug>/page.tsx. The nav never needs to change,
 * because it lists CATEGORIES (bounded), not individual guides (unbounded).
 */

export type GuideCategoryKey = 'getting-started' | 'airlines' | 'hotels' | 'cards'

export interface GuideCategory {
  key: GuideCategoryKey
  label: string
  blurb: string
}

/** Display order on the hub + in the Resources dropdown. */
export const GUIDE_CATEGORIES: GuideCategory[] = [
  { key: 'getting-started', label: 'Getting Started', blurb: 'New to points and miles? Start here.' },
  { key: 'airlines', label: 'Airlines & Flying', blurb: 'Upgrades, award flights, alliances, and lounges.' },
  { key: 'hotels', label: 'Hotels & Stays', blurb: 'Best rate guarantees, elite status, and free nights.' },
  { key: 'cards', label: 'Cards & Points', blurb: 'Transfers, welcome bonuses, and choosing a card.' },
]

export interface Guide {
  /** Path segment under /guides/ — must match the page folder name. */
  slug: string
  title: string
  /** One-line summary for the hub card + related-guide callouts. */
  description: string
  category: GuideCategoryKey
  /** ISO date (YYYY-MM-DD) the content was last verified. */
  updated?: string
  /** Surfaces higher on the hub within its category. */
  featured?: boolean
}

export const GUIDES: Guide[] = [
  {
    slug: 'find-your-why',
    title: 'What Kind of Points Traveler Are You?',
    description:
      'Before you pick a card, figure out what you actually want from travel. Find your "why," and the "how" gets easy.',
    category: 'getting-started',
    updated: '2026-07-12',
    featured: true,
  },
  {
    slug: 'how-points-transfers-work',
    title: 'How Points Transfers Work: A Beginner’s Guide',
    description:
      'The one skill that turns credit card points into airline miles, and why the same seat can cost far fewer points depending on where you book it.',
    category: 'getting-started',
    updated: '2026-08-13',
    featured: true,
  },
  {
    slug: 'hidden-perk-stacks',
    title: 'Hidden Perk Stacks: Card Benefits That Unlock More Benefits',
    description:
      'The tricks nobody tells you: one card credit unlocks a service that bundles even more, from free streaming to hotel status to the two fastest airport lanes.',
    category: 'cards',
    updated: '2026-08-13',
    featured: true,
  },
  {
    slug: 'best-first-card',
    title: 'The Best First Card for Every Type of Traveler',
    description:
      'You know your travel why. Now the one card to actually apply for, one anchor pick per traveler type, grounded in real card data.',
    category: 'cards',
    updated: '2026-07-12',
    featured: true,
  },
  {
    slug: 'how-to-upgrade-american-first-class',
    title: 'How to Upgrade to First Class on American Airlines',
    description:
      'Every current way to upgrade, when each offer appears, and how to use miles or cash to get there.',
    category: 'airlines',
    updated: '2026-07-12',
    featured: true,
  },
  {
    slug: 'how-to-book-a-sold-out-hotel',
    title: 'How to Book a Sold-Out Hotel',
    description:
      'Guaranteed room availability: the elite perk that books you a standard room when a hotel shows sold out, and the cheapest cards that unlock it.',
    category: 'hotels',
    updated: '2026-07-12',
    featured: true,
  },
  {
    slug: 'hotel-best-rate-guarantees',
    title: 'Hotel & Travel-Portal Best Rate Guarantees',
    description:
      'Who has a best rate guarantee, what you actually get, and how to win a claim, from official terms.',
    category: 'hotels',
    updated: '2026-07-10',
    featured: true,
  },
  {
    slug: 'how-to-win-a-best-rate-guarantee',
    title: 'How to Actually Win a Best Rate Guarantee',
    description:
      '31 tips pulled straight from the fine print to get your price-match claim approved.',
    category: 'hotels',
    updated: '2026-07-10',
  },
  {
    slug: 'should-you-buy-ihg-points',
    title: 'Should You Buy IHG Points?',
    description:
      'When an IHG points bonus is actually a deal, the 4th-reward-night-free card trick that doubles it, and a real all-inclusive Iberostar redemption.',
    category: 'hotels',
    updated: '2026-08-03',
  },
  {
    slug: 'how-to-add-your-card-to-paze',
    title: 'Having Trouble Adding Your Card to Paze?',
    description:
      'Paze is not like Apple Pay: you switch it on one card at a time inside the Chase app. The 30-second fix, step by step.',
    category: 'cards',
    updated: '2026-08-04',
  },
  {
    slug: 'hyatt-points-sweet-spots',
    title: 'The Best Hyatt Sweet Spots (After the 2026 Chart Refresh)',
    description:
      'Where World of Hyatt points still win after the 5-tier overhaul: low-category steals, aspirational Park Hyatts and Alilas, all-inclusives, and the smart mechanics, with the current chart.',
    category: 'hotels',
    updated: '2026-08-06',
    featured: true,
  },
]

/**
 * Program → guide association. When a program has a dedicated deep-dive guide,
 * its page shows a gold "Guide" pill in the hero + a related-guide callout under
 * the intro. Keyed by programs.slug. `guideSlug` must match a GUIDES entry.
 */
export interface ProgramGuideLink {
  guideSlug: string
  /** Short title for the under-intro callout. */
  calloutTitle: string
  /** One-line blurb for the callout. */
  calloutBlurb: string
}

export const GUIDE_BY_PROGRAM_SLUG: Record<string, ProgramGuideLink[]> = {
  aa: [
    {
      guideSlug: 'how-to-upgrade-american-first-class',
      calloutTitle: 'How to upgrade to First on American',
      calloutBlurb:
        'Complimentary upgrades, Instant Upgrades with cash or miles, and the timing that actually gets you into First.',
    },
  ],
  hyatt: [
    {
      guideSlug: 'hyatt-points-sweet-spots',
      calloutTitle: 'The best Hyatt sweet spots after the 2026 refresh',
      calloutBlurb:
        'Where your Hyatt points still win: low-category steals, aspirational Park Hyatts and Alilas, and all-inclusives, with the current 5-tier chart.',
    },
    {
      guideSlug: 'how-to-book-a-sold-out-hotel',
      calloutTitle: 'Book a sold-out Hyatt with Explorist status',
      calloutBlurb:
        'Hyatt is the only program where mid-tier status unlocks guaranteed room availability. Here is how to use it.',
    },
  ],
  ihg: [
    {
      guideSlug: 'how-to-book-a-sold-out-hotel',
      calloutTitle: 'Book a sold-out IHG hotel with Platinum status',
      calloutBlurb:
        'IHG Platinum guarantees a standard room 72 hours out, and the ~$99 IHG Premier card hands you that status.',
    },
  ],
  'marriott-bonvoy': [
    {
      guideSlug: 'how-to-book-a-sold-out-hotel',
      calloutTitle: 'Book a sold-out Marriott with Platinum status',
      calloutBlurb:
        'Marriott Platinum and above get a standard room even when sold out, if you book 48 hours ahead.',
    },
  ],
  hilton: [
    {
      guideSlug: 'how-to-book-a-sold-out-hotel',
      calloutTitle: 'Book a sold-out Hilton with Diamond status',
      calloutBlurb:
        'Hilton Diamond guarantees a standard room 48 hours out, and the Aspire card hands you Diamond automatically.',
    },
  ],
}

/** All guides associated with a program slug, each with a ready href. */
export function getProgramGuides(programSlug: string): Array<ProgramGuideLink & { href: string }> {
  return (GUIDE_BY_PROGRAM_SLUG[programSlug] ?? []).map((g) => ({ ...g, href: `/guides/${g.guideSlug}` }))
}

/**
 * Card → guide association. Surfaces a related-guide callout on a card's
 * /cards/[slug] page. Keyed by credit_cards.slug. Two angles are wired:
 *  - Best Rate Guarantee guide on cards whose travel portal price-matches.
 *  - Sold-out-hotel guide on cards that grant a guaranteed-availability tier.
 */
export const GUIDE_BY_CARD_SLUG: Record<string, ProgramGuideLink[]> = {
  // Travel-portal price match -> Best Rate Guarantee guide
  'capital-one-venture-x': [
    { guideSlug: 'hotel-best-rate-guarantees', calloutTitle: 'Capital One Travel price-matches your hotel', calloutBlurb: 'It refunds 100% of the difference if the price drops. Our guide covers every hotel and travel-portal price guarantee.' },
  ],
  'capital-one-venture': [
    { guideSlug: 'hotel-best-rate-guarantees', calloutTitle: 'Capital One Travel price-matches your hotel', calloutBlurb: 'It refunds 100% of the difference if the price drops. Our guide covers every hotel and travel-portal price guarantee.' },
  ],
  'amex-platinum': [
    { guideSlug: 'hotel-best-rate-guarantees', calloutTitle: 'Amex Travel has a hotel price guarantee', calloutBlurb: 'Our best rate guarantee guide covers Amex Travel plus every major hotel and portal price match.' },
  ],
  'amex-gold': [
    { guideSlug: 'hotel-best-rate-guarantees', calloutTitle: 'Amex Travel has a hotel price guarantee', calloutBlurb: 'Our best rate guarantee guide covers Amex Travel plus every major hotel and portal price match.' },
  ],
  // Guaranteed-availability status -> sold-out-hotel guide (CSR gets both)
  'chase-sapphire-reserve': [
    { guideSlug: 'how-to-book-a-sold-out-hotel', calloutTitle: 'This card can book sold-out hotels', calloutBlurb: 'Your IHG Platinum (and Hyatt Explorist at $75K spend) unlocks guaranteed room availability. Here is how to use it.' },
    { guideSlug: 'hotel-best-rate-guarantees', calloutTitle: 'Every hotel best rate guarantee, in one place', calloutBlurb: 'Who price-matches, what you get, and how to win a claim, from official terms.' },
  ],
  'chase-ihg-one-rewards-premier': [
    { guideSlug: 'how-to-book-a-sold-out-hotel', calloutTitle: 'Book sold-out IHG hotels with this card', calloutBlurb: 'Its automatic IHG Platinum status guarantees a standard room 72 hours out, even when the hotel shows sold out.' },
  ],
  'amex-hilton-honors-aspire': [
    { guideSlug: 'how-to-book-a-sold-out-hotel', calloutTitle: 'Book sold-out Hiltons with this card', calloutBlurb: 'Aspire’s automatic Hilton Diamond unlocks guaranteed room availability 48 hours out.' },
  ],
  'marriott-bonvoy-brilliant': [
    { guideSlug: 'how-to-book-a-sold-out-hotel', calloutTitle: 'Book sold-out Marriotts with this card', calloutBlurb: 'Brilliant’s automatic Marriott Platinum unlocks guaranteed room availability 48 hours out.' },
  ],
}

/** All guides associated with a card slug, each with a ready href. */
export function getCardGuides(cardSlug: string): Array<ProgramGuideLink & { href: string }> {
  return (GUIDE_BY_CARD_SLUG[cardSlug] ?? []).map((g) => ({ ...g, href: `/guides/${g.guideSlug}` }))
}

/** Guides in a category, featured first, then alphabetical by title. */
export function guidesInCategory(key: GuideCategoryKey): Guide[] {
  return GUIDES.filter((g) => g.category === key).sort(
    (a, b) => Number(!!b.featured) - Number(!!a.featured) || a.title.localeCompare(b.title),
  )
}

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}
