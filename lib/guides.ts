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

/** Guides in a category, featured first, then alphabetical by title. */
export function guidesInCategory(key: GuideCategoryKey): Guide[] {
  return GUIDES.filter((g) => g.category === key).sort(
    (a, b) => Number(!!b.featured) - Number(!!a.featured) || a.title.localeCompare(b.title),
  )
}

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}
