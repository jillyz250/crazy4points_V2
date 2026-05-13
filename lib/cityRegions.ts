/**
 * City → region lookup for the Active Promos bucketing UI on
 * /programs/[slug]. Used to group scraped promo destinations into
 * regional buckets for scannability.
 *
 * Region values intentionally mirror the existing partner_redemptions
 * region enums (lib/airports + partner_redemptions.origin_region/
 * dest_region check constraint) so future taxonomies stay consistent.
 *
 * When a city isn't in the map, it goes to "other". Add new cities as
 * scrapers surface them.
 */

export type PromoRegion =
  | 'western_europe'
  | 'eastern_europe'
  | 'north_america'
  | 'caribbean'
  | 'latin_america'
  | 'asia'
  | 'africa_indian_ocean'
  | 'oceania'
  | 'middle_east'
  | 'other'

/** Display label per region. Kept short for bucket headers. */
export const REGION_LABEL: Record<PromoRegion, string> = {
  western_europe: 'Western Europe',
  eastern_europe: 'Eastern Europe',
  north_america: 'North America',
  caribbean: 'Caribbean & French Overseas',
  latin_america: 'Latin America',
  asia: 'Asia',
  africa_indian_ocean: 'Africa & Indian Ocean',
  oceania: 'Oceania',
  middle_east: 'Middle East',
  other: 'Other regions',
}

/** Sort order for bucket display — most-popular regions first. */
export const REGION_ORDER: PromoRegion[] = [
  'western_europe',
  'north_america',
  'eastern_europe',
  'caribbean',
  'latin_america',
  'middle_east',
  'asia',
  'oceania',
  'africa_indian_ocean',
  'other',
]

/**
 * Lookup: lowercased city name → region.
 * Includes common variants (e.g. "new york" + "nyc").
 * Add entries as new scraper destinations appear.
 */
const CITY_TO_REGION: Record<string, PromoRegion> = {
  // ── Western Europe ──
  amsterdam: 'western_europe',
  paris: 'western_europe',
  geneva: 'western_europe',
  zurich: 'western_europe',
  munich: 'western_europe',
  nice: 'western_europe',
  nantes: 'western_europe',
  bordeaux: 'western_europe',
  toulouse: 'western_europe',
  barcelona: 'western_europe',
  madrid: 'western_europe',
  berlin: 'western_europe',
  copenhagen: 'western_europe',
  stockholm: 'western_europe',
  edinburgh: 'western_europe',
  london: 'western_europe',
  southampton: 'western_europe',
  dublin: 'western_europe',
  helsinki: 'western_europe',
  vienna: 'western_europe',
  brussels: 'western_europe',
  rome: 'western_europe',
  milan: 'western_europe',
  lisbon: 'western_europe',
  oslo: 'western_europe',
  frankfurt: 'western_europe',
  hamburg: 'western_europe',
  athens: 'western_europe',

  // ── Eastern Europe ──
  bucharest: 'eastern_europe',
  warsaw: 'eastern_europe',
  prague: 'eastern_europe',
  budapest: 'eastern_europe',
  sofia: 'eastern_europe',

  // ── North America ──
  'new york': 'north_america',
  nyc: 'north_america',
  newark: 'north_america',
  chicago: 'north_america',
  washington: 'north_america',
  'washington dc': 'north_america',
  'raleigh/durham': 'north_america',
  raleigh: 'north_america',
  durham: 'north_america',
  phoenix: 'north_america',
  dallas: 'north_america',
  orlando: 'north_america',
  denver: 'north_america',
  'san diego': 'north_america',
  'las vegas': 'north_america',
  'los angeles': 'north_america',
  seattle: 'north_america',
  miami: 'north_america',
  boston: 'north_america',
  austin: 'north_america',
  portland: 'north_america',
  'portland, or': 'north_america',
  atlanta: 'north_america',
  detroit: 'north_america',
  minneapolis: 'north_america',
  houston: 'north_america',
  'san francisco': 'north_america',
  toronto: 'north_america',
  vancouver: 'north_america',
  montreal: 'north_america',
  honolulu: 'north_america', // grouped with NA per current taxonomy

  // ── Caribbean & French Overseas ──
  'st martin': 'caribbean',
  'saint martin': 'caribbean',
  'pointe à pitre': 'caribbean',
  'pointe a pitre': 'caribbean',
  'fort de france': 'caribbean',
  martinique: 'caribbean',
  guadeloupe: 'caribbean',
  havana: 'caribbean',
  nassau: 'caribbean',
  cancun: 'caribbean',
  'punta cana': 'caribbean',

  // ── Latin America ──
  'mexico city': 'latin_america',
  bogota: 'latin_america',
  cartagena: 'latin_america',
  'buenos aires': 'latin_america',
  paramaribo: 'latin_america',
  lima: 'latin_america',
  santiago: 'latin_america',
  'rio de janeiro': 'latin_america',
  'sao paulo': 'latin_america',
  'são paulo': 'latin_america',

  // ── Middle East ──
  dubai: 'middle_east',
  'abu dhabi': 'middle_east',
  doha: 'middle_east',
  istanbul: 'middle_east',
  'tel aviv': 'middle_east',
  riyadh: 'middle_east',
  amman: 'middle_east',

  // ── Asia ──
  tokyo: 'asia',
  osaka: 'asia',
  seoul: 'asia',
  'hong kong': 'asia',
  shanghai: 'asia',
  beijing: 'asia',
  singapore: 'asia',
  bangkok: 'asia',
  'kuala lumpur': 'asia',
  manila: 'asia',
  jakarta: 'asia',
  'ho chi minh city': 'asia',
  hanoi: 'asia',
  taipei: 'asia',
  mumbai: 'asia',
  'mumbai/bombay': 'asia',
  bombay: 'asia',
  delhi: 'asia',
  bangalore: 'asia',
  bengaluru: 'asia',

  // ── Oceania ──
  sydney: 'oceania',
  melbourne: 'oceania',
  brisbane: 'oceania',
  auckland: 'oceania',
  perth: 'oceania',
  fiji: 'oceania',

  // ── Africa & Indian Ocean ──
  johannesburg: 'africa_indian_ocean',
  'cape town': 'africa_indian_ocean',
  nairobi: 'africa_indian_ocean',
  'addis ababa': 'africa_indian_ocean',
  cairo: 'africa_indian_ocean',
  casablanca: 'africa_indian_ocean',
  'saint-denis (réunion)': 'africa_indian_ocean',
  'saint-denis': 'africa_indian_ocean',
  reunion: 'africa_indian_ocean',
  réunion: 'africa_indian_ocean',
  antananarivo: 'africa_indian_ocean',
  mauritius: 'africa_indian_ocean',
}

/**
 * Look up the region for a city name. Case-insensitive, whitespace-
 * normalized. Returns 'other' when no match.
 */
export function getRegionForCity(city: string | null | undefined): PromoRegion {
  if (!city) return 'other'
  const normalized = city.trim().toLowerCase()
  return CITY_TO_REGION[normalized] ?? 'other'
}
