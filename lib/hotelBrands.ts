/**
 * Hotel brand portfolios, grouped by segment, for the pill row at the top of a
 * hotel program page (mirrors how airline alliance pages show member operators).
 *
 * Single source of truth in code (like lib/guides.ts) rather than the database:
 * brand rosters change only a few times a year, need no admin editing, and are
 * safest reviewed in a PR diff. Keyed by programs.slug.
 *
 * SOURCING RULE: brand lists come ONLY from each chain's official portfolio
 * (brand page, newsroom, or SEC filing) — never padded from memory. The segment
 * labels are a normalized, reader-friendly taxonomy applied on top of each
 * chain's official positioning (a beginner understands "Luxury" faster than a
 * chain's internal collection name). Source per program noted inline.
 */

export interface BrandSegment {
  /** Reader-facing segment label, e.g. "Luxury", "Select". */
  segment: string
  /** Brand display names, in the chain's official order where possible. */
  brands: string[]
}

/** Segment display order — every program renders its segments in this order. */
export const SEGMENT_ORDER = ['Luxury', 'Lifestyle', 'Premium', 'Select', 'Extended Stay', 'All-Inclusive'] as const

export const HOTEL_BRANDS: Record<string, BrandSegment[]> = {
  // Source: marriott.com/marriott-brands.mi (official brand portfolio page).
  'marriott-bonvoy': [
    { segment: 'Luxury', brands: ['The Ritz-Carlton', 'Ritz-Carlton Reserve', 'St. Regis', 'JW Marriott', 'The Luxury Collection', 'W Hotels', 'EDITION'] },
    { segment: 'Lifestyle', brands: ['Autograph Collection', 'Tribute Portfolio', 'Design Hotels', 'MGM Collection', 'Outdoor Collection'] },
    { segment: 'Premium', brands: ['Marriott Hotels', 'Sheraton', 'Westin', 'Delta Hotels', 'Le Meridien', 'Renaissance Hotels', 'Gaylord Hotels', 'Marriott Vacation Club'] },
    { segment: 'Select', brands: ['Courtyard', 'Four Points', 'SpringHill Suites', 'Fairfield', 'AC Hotels', 'citizenM', 'Aloft', 'Moxy', 'Protea Hotels', 'City Express', 'Four Points Flex', 'Series by Marriott'] },
    { segment: 'Extended Stay', brands: ['Residence Inn', 'TownePlace Suites', 'Element', 'StudioRes', 'Apartments by Marriott Bonvoy', 'Homes & Villas by Marriott Bonvoy', 'Marriott Executive Apartments'] },
  ],
  // Source: Hyatt newsroom + SEC 424B5 (official 4-collection portfolio),
  // normalized into reader-facing segments.
  hyatt: [
    { segment: 'Luxury', brands: ['Park Hyatt', 'Alila', 'Miraval', 'Impression by Secrets'] },
    { segment: 'Lifestyle', brands: ['Andaz', 'Thompson Hotels', 'Dream Hotels', 'Hyatt Centric', 'Caption by Hyatt', 'The Unbound Collection', 'Destination by Hyatt', 'JdV by Hyatt'] },
    { segment: 'Premium', brands: ['Grand Hyatt', 'Hyatt Regency', 'Hyatt'] },
    { segment: 'Select', brands: ['Hyatt Place', 'Hyatt House', 'Hyatt Studios', 'UrCove', 'Hyatt Residence Club'] },
    { segment: 'All-Inclusive', brands: ['Hyatt Ziva', 'Hyatt Zilara', 'Secrets', 'Dreams', 'Breathless', 'Zoetry', 'Alua', 'Sunscape', 'Hyatt Vivid'] },
  ],
}

/** Brand segments for a program slug (empty array if not yet populated). */
export function getHotelBrands(slug: string): BrandSegment[] {
  return HOTEL_BRANDS[slug] ?? []
}

/** Total brand count across all segments — handy for a summary line. */
export function hotelBrandCount(slug: string): number {
  return getHotelBrands(slug).reduce((n, s) => n + s.brands.length, 0)
}
