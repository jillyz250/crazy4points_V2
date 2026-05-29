/**
 * Carrier-presence filter for "Best Way to Book It".
 *
 * Problem this solves: redemption rows are gated to a route by a COARSE
 * regional bucket (e.g. "within-US-short-haul"), not by the specific city
 * pair. So a carrier whose network doesn't reach one of the two airports
 * (e.g. Alaska on New York LGA -> Columbus CMH) still shows up. That's wrong.
 *
 * Fix: a curated map of which of OUR airports each carrier serves. Because
 * award itineraries allow connections, the correct test for "is this metal
 * plausibly bookable A->B" is "does the carrier serve BOTH endpoints" — not
 * "is there a nonstop". We apply it ONLY to North-America routes (where coarse
 * buckets overlap many non-overlapping spoke networks) and FAIL OPEN
 * everywhere else, and for any carrier we haven't mapped yet.
 *
 * See data/carrier-airports.json for the data + sourcing notes.
 */
import type { Airport, AirportRegion } from './airports'
import carrierData from '@/data/carrier-airports.json'

const NA_REGIONS = new Set<AirportRegion>([
  'us-east',
  'us-central',
  'us-west',
  'us-alaska',
  'us-hawaii',
  'canada',
  'mexico-carib',
  'central-america',
])

export function isNorthAmerica(airport: Airport): boolean {
  return NA_REGIONS.has(airport.region)
}

const CARRIERS: Record<string, string[]> =
  (carrierData as { carriers?: Record<string, string[]> }).carriers ?? {}

// Pre-build a Set per mapped carrier for O(1) membership.
const SERVED: Map<string, Set<string>> = new Map(
  Object.entries(CARRIERS).map(([slug, iatas]) => [slug, new Set(iatas)]),
)

/** True if we have an authored presence list for this carrier slug. */
export function isCarrierMapped(slug: string | null | undefined): boolean {
  return slug != null && SERVED.has(slug)
}

/**
 * Does the carrier serve a given airport (within our universe)?
 * Returns null when the carrier is unmapped (caller should fail open).
 */
export function carrierServes(slug: string, iata: string): boolean | null {
  const set = SERVED.get(slug)
  if (!set) return null
  return set.has(iata)
}

/**
 * Decide whether a row should be SHOWN for this route.
 *
 *  - Long-haul / non-North-America route  -> always keep (fail open).
 *  - Carrier not mapped yet               -> keep (fail open).
 *  - Both endpoints in North America      -> keep only if carrier serves both.
 */
export function carrierAllowedOnRoute(
  slug: string | null | undefined,
  origin: Airport,
  destination: Airport,
): boolean {
  if (!slug) return true
  if (!(isNorthAmerica(origin) && isNorthAmerica(destination))) return true
  const o = carrierServes(slug, origin.iata)
  const d = carrierServes(slug, destination.iata)
  if (o == null || d == null) return true // unmapped -> fail open
  return o && d
}
