import airportsJson from '@/data/airports.json'

export type AirportRegion =
  | 'us-east'
  | 'us-central'
  | 'us-west'
  | 'us-alaska'
  | 'us-hawaii'
  | 'canada'
  | 'mexico-carib'
  | 'central-america'
  | 'south-america'
  | 'europe'
  | 'middle-east'
  | 'india'
  | 'africa'
  | 'japan-korea'
  | 'se-asia'
  | 'pacific'

export interface Airport {
  iata: string
  name: string
  city: string
  country: string
  country_code: string
  region: AirportRegion
  lat: number
  lng: number
}

export type RouteBucket =
  | 'us-short'
  | 'us-medium'
  | 'us-long'
  | 'us-mexico-carib'
  | 'us-camerica'
  | 'us-canada'
  | 'us-eu-east'
  | 'us-eu-west'
  | 'us-japan'
  | 'us-se-asia'
  | 'us-me-india'
  | 'us-pacific'
  | 'us-africa'
  | 'us-samerica'

export const AIRPORTS: Airport[] = airportsJson as Airport[]

const AIRPORT_BY_IATA: Map<string, Airport> = new Map(
  AIRPORTS.map((a) => [a.iata, a]),
)

export function findAirport(iata: string): Airport | null {
  return AIRPORT_BY_IATA.get(iata.toUpperCase()) ?? null
}

/**
 * Great-circle distance between two airports in statute miles.
 * Haversine formula. ~99% accurate for award-chart purposes.
 */
export function distanceMiles(a: Airport, b: Airport): number {
  const R = 3958.8 // earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

/**
 * Determine the route_bucket for a pair of airports.
 *
 * Rules:
 *   - Both within US (including Alaska, Hawaii) → distance band (short / medium / long)
 *   - US ↔ Europe → east/west by origin longitude (< -100 → west; else east)
 *   - US ↔ Japan/Korea → us-japan
 *   - US ↔ SE Asia/China → us-se-asia
 *   - US ↔ Middle East/India → us-me-india
 *   - US ↔ Pacific → us-pacific
 *   - US ↔ Africa → us-africa
 *   - US ↔ South America → us-samerica
 *
 * Returns null for routes we don't yet cover (intra-Europe, intra-Asia, etc.).
 */
export function mapRouteToBucket(
  origin: Airport,
  destination: Airport,
): RouteBucket | null {
  const isUS = (a: Airport) =>
    a.country_code === 'US' ||
    a.region === 'us-east' ||
    a.region === 'us-central' ||
    a.region === 'us-west' ||
    a.region === 'us-alaska' ||
    a.region === 'us-hawaii'

  const originUS = isUS(origin)
  const destUS = isUS(destination)

  // Both US
  if (originUS && destUS) {
    const d = distanceMiles(origin, destination)
    if (d < 700) return 'us-short'
    if (d < 2500) return 'us-medium'
    return 'us-long'
  }

  // One side US, other international
  if (originUS || destUS) {
    const intl = originUS ? destination : origin
    const usSide = originUS ? origin : destination

    switch (intl.region) {
      case 'europe': {
        // Use US-side longitude to pick east vs. west coast bucket
        return usSide.lng < -100 ? 'us-eu-west' : 'us-eu-east'
      }
      case 'japan-korea':
        return 'us-japan'
      case 'se-asia':
      case 'india':
        // India falls into ME bucket per AA's chart (US to ME/India)
        return intl.region === 'india' ? 'us-me-india' : 'us-se-asia'
      case 'middle-east':
        return 'us-me-india'
      case 'pacific':
        return 'us-pacific'
      case 'africa':
        return 'us-africa'
      case 'south-america':
        return 'us-samerica'
      case 'mexico-carib':
        // US <-> Mexico / Caribbean is its OWN region on award charts. It is
        // NOT domestic — programs price it on a North-America/regional rate,
        // not the us-medium distance band. (Distance-based programs like the
        // Avios family still price it by flown distance via the chart compute.)
        return 'us-mexico-carib'
      case 'central-america':
        return 'us-camerica'
      case 'canada':
        // Canada is international too. Some charts price it like US domestic,
        // but it gets its own bucket so the label is honest and rows can be
        // tagged per program.
        return 'us-canada'
      default:
        return null
    }
  }

  // Both international — not covered in v1
  return null
}

/**
 * Human-readable label for a route bucket (used in the UI).
 */
export const ROUTE_BUCKET_LABELS: Record<RouteBucket, string> = {
  'us-short': 'Within US — short-haul',
  'us-medium': 'Within US — medium-haul',
  'us-long': 'Within US — long-haul',
  'us-mexico-carib': 'US ↔ Mexico / Caribbean',
  'us-camerica': 'US ↔ Central America',
  'us-canada': 'US ↔ Canada',
  'us-eu-east': 'US East Coast ↔ Europe',
  'us-eu-west': 'US West Coast ↔ Europe',
  'us-japan': 'US ↔ Japan / Korea',
  'us-se-asia': 'US ↔ SE Asia / China',
  'us-me-india': 'US ↔ Middle East / India',
  'us-pacific': 'US ↔ South Pacific',
  'us-africa': 'US ↔ Africa',
  'us-samerica': 'US ↔ South America',
}

/**
 * Light client-side autocomplete: substring match against IATA, city, or name.
 * Sorted by IATA exact-match first, then city, then name.
 */
export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.trim().toUpperCase()
  if (!q) return []
  const out: { airport: Airport; rank: number }[] = []
  for (const a of AIRPORTS) {
    let rank = 99
    if (a.iata === q) rank = 0
    else if (a.iata.startsWith(q)) rank = 1
    else if (a.city.toUpperCase().startsWith(q)) rank = 2
    else if (a.city.toUpperCase().includes(q)) rank = 3
    else if (a.name.toUpperCase().includes(q)) rank = 4
    if (rank < 99) out.push({ airport: a, rank })
  }
  out.sort((x, y) => x.rank - y.rank || x.airport.iata.localeCompare(y.airport.iata))
  return out.slice(0, limit).map((x) => x.airport)
}
