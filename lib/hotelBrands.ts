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
export const SEGMENT_ORDER = ['Luxury', 'Lifestyle', 'Premium', 'Select', 'Economy', 'Extended Stay', 'All-Inclusive'] as const

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
  // Source: hilton.com/en/brands (official brand portfolio). Owned brands only
  // (partner/membership listings like Hilton Grand Vacations, SLH, AutoCamp,
  // Explora Journeys are omitted).
  hilton: [
    { segment: 'Luxury', brands: ['Waldorf Astoria', 'LXR', 'Conrad', 'Signia by Hilton', 'NoMad'] },
    { segment: 'Lifestyle', brands: ['Canopy by Hilton', 'Graduate by Hilton', 'Tempo by Hilton', 'Motto by Hilton', 'Undergraduate by Hilton', 'Curio Collection', 'Tapestry Collection', 'Outset Collection'] },
    { segment: 'Premium', brands: ['Hilton Hotels & Resorts', 'DoubleTree'] },
    { segment: 'Select', brands: ['Hilton Garden Inn', 'Hampton by Hilton', 'Tru by Hilton', 'Spark by Hilton'] },
    { segment: 'Extended Stay', brands: ['Embassy Suites', 'Homewood Suites', 'Home2 Suites', 'LivSmart Studios', 'Apartment Collection by Hilton'] },
  ],
  // Source: ihgplc.com/en/our-brands (official brand portfolio).
  ihg: [
    { segment: 'Luxury', brands: ['InterContinental', 'Regent', 'Six Senses', 'Vignette Collection', 'Kimpton', 'HUALUXE'] },
    { segment: 'Lifestyle', brands: ['Hotel Indigo', 'voco', 'Ruby', 'Noted Collection'] },
    { segment: 'Premium', brands: ['Crowne Plaza', 'EVEN Hotels', 'Iberostar Beachfront Resorts'] },
    { segment: 'Select', brands: ['Holiday Inn', 'Holiday Inn Express', 'Garner', 'avid'] },
    { segment: 'Extended Stay', brands: ['Staybridge Suites', 'Atwell Suites', 'Candlewood Suites', 'Holiday Inn Club Vacations'] },
  ],
  // Source: corporate.wyndhamhotels.com/about-us/our-brands (official). No true
  // luxury tier; heavy on midscale and economy.
  wyndham: [
    { segment: 'Premium', brands: ['Wyndham Grand', 'Dolce Hotels and Resorts', 'Registry Collection'] },
    { segment: 'Lifestyle', brands: ['Trademark Collection', 'TRYP by Wyndham', 'Esplendor', 'Dazzler', 'Vienna House'] },
    { segment: 'Select', brands: ['Wyndham', 'Wyndham Garden', 'Ramada', 'Ramada Encore', 'Wingate', 'Baymont', 'La Quinta', 'AmericInn', 'Microtel'] },
    { segment: 'Economy', brands: ['Days Inn', 'Super 8', 'Howard Johnson', 'Travelodge'] },
    { segment: 'Extended Stay', brands: ['Hawthorn Extended Stay', 'ECHO Suites', 'WaterWalk'] },
    { segment: 'All-Inclusive', brands: ['Wyndham Alltra'] },
  ],
  // Source: choicehotels.com/about/brands (official; includes the Radisson
  // Americas brands Choice acquired).
  choice: [
    { segment: 'Lifestyle', brands: ['Cambria', 'Ascend Collection', 'Radisson Collection', 'Radisson Blu', 'Radisson RED', 'Radisson Individuals', 'Park Plaza'] },
    { segment: 'Premium', brands: ['Radisson', 'Country Inn & Suites', 'Park Inn by Radisson', 'Clarion'] },
    { segment: 'Select', brands: ['Comfort', 'Quality Inn', 'Sleep Inn', 'Clarion Pointe', 'Radisson Inn & Suites'] },
    { segment: 'Economy', brands: ['Econo Lodge', 'Rodeway Inn'] },
    { segment: 'Extended Stay', brands: ['WoodSpring Suites', 'Everhome Suites', 'MainStay Suites', 'Suburban Studios'] },
  ],
  // Source: all.accor.com/a/en/brands.html (official brand directory). Core
  // globally-recognized hotel brands; non-hotel lines (Thalassa spa,
  // Onefinestay villas, loyalty/partner labels) omitted.
  accor: [
    { segment: 'Luxury', brands: ['Raffles', 'Orient Express', 'Faena', 'Fairmont', 'Sofitel', 'Sofitel Legend', 'Rixos', 'Emblems', 'MGallery', 'Banyan Tree'] },
    { segment: 'Lifestyle', brands: ['SO/', 'SLS', 'Delano', 'Mondrian', 'Hyde', 'The Hoxton', '25hours', 'Mama Shelter', 'TRIBE', 'JO&JOE', 'Morgans Originals', '21c', 'Art Series', 'Handwritten Collection'] },
    { segment: 'Premium', brands: ['Pullman', 'Swissotel', 'Movenpick', 'Grand Mercure', 'Angsana', 'Mantis', 'Peppers', 'The Sebel'] },
    { segment: 'Select', brands: ['Novotel', 'Mercure', 'Adagio', 'Mantra'] },
    { segment: 'Economy', brands: ['ibis', 'ibis Styles', 'ibis budget', 'greet', 'hotelF1', 'BreakFree'] },
  ],
  // Source: radissonhotels.com/en-us/corporate/about-us/our-brands (Radisson
  // Hotel Group / EMEA-APAC; the Americas brands are operated by Choice).
  radisson: [
    { segment: 'Luxury', brands: ['Radisson Collection'] },
    { segment: 'Lifestyle', brands: ['Radisson RED', "art'otel", 'Radisson Individuals', 'Park Plaza'] },
    { segment: 'Premium', brands: ['Radisson Blu'] },
    { segment: 'Select', brands: ['Radisson', 'Park Inn by Radisson'] },
    { segment: 'Economy', brands: ['Prize by Radisson'] },
  ],
  // Source: shangri-la.com/group (official four-brand portfolio).
  'shangri-la': [
    { segment: 'Luxury', brands: ['Shangri-La', 'Kerry Hotels'] },
    { segment: 'Lifestyle', brands: ['JEN by Shangri-La'] },
    { segment: 'Select', brands: ['Traders'] },
  ],
  // Source: bwhhotels.com / bestwestern.com brands (BWH Hotels: WorldHotels,
  // Best Western, and SureStay families).
  'best-western': [
    { segment: 'Luxury', brands: ['WorldHotels Luxury', 'WorldHotels Elite'] },
    { segment: 'Lifestyle', brands: ['Aiden', 'Sadie', 'Vib', 'Glo', 'WorldHotels Crafted', 'WorldHotels Distinctive'] },
    { segment: 'Premium', brands: ['Best Western Premier', 'BW Premier Collection', 'WorldHotels Backdrop'] },
    { segment: 'Select', brands: ['Best Western', 'Best Western Plus', 'BW Signature Collection'] },
    { segment: 'Economy', brands: ['SureStay', 'SureStay Plus', 'SureStay Collection'] },
    { segment: 'Extended Stay', brands: ['Executive Residency by Best Western', 'SureStay Studio'] },
  ],
  // Source: sonesta.com/our-brands (official; includes the Red Lion brands
  // Sonesta acquired). Sonesta Cruises omitted (not a hotel brand).
  sonesta: [
    { segment: 'Luxury', brands: ['The Royal Sonesta', 'The James'] },
    { segment: 'Lifestyle', brands: ['MOD', 'Classico'] },
    { segment: 'Premium', brands: ['Sonesta Hotels & Resorts'] },
    { segment: 'Select', brands: ['Sonesta Select', 'Sonesta Essential'] },
    { segment: 'Economy', brands: ['Red Lion Hotels', 'Red Lion Inn & Suites', 'Signature Inn', 'Americas Best Value Inn', 'Canadas Best Value Inn'] },
    { segment: 'Extended Stay', brands: ['Sonesta ES Suites', 'Sonesta Simply Suites'] },
  ],
  // Source: melia.com/en/brands (official).
  melia: [
    { segment: 'Luxury', brands: ['Gran Melia', 'ME by Melia'] },
    { segment: 'Lifestyle', brands: ['Zel', 'Circle by Melia'] },
    { segment: 'Premium', brands: ['Melia Hotels & Resorts', 'Innside by Melia'] },
    { segment: 'Select', brands: ['Sol by Melia'] },
    { segment: 'All-Inclusive', brands: ['Paradisus'] },
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
