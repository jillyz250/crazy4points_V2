/**
 * Translate the operating-carrier display name when the program row is
 * dual-role (the same row serves as both the loyalty program and the
 * carrier metal).
 *
 * Why: programs.name reads "American AAdvantage" (the loyalty program
 * brand). When we render that as the operating carrier, it confuses the
 * reader — they're booking flights on metal, not on a loyalty program.
 * Show the airline metal name instead.
 *
 * If a slug isn't in the override map, we return the name as-is (most
 * carrier rows are NOT dual-role and already have airline-flavored names
 * like "Air Canada Aeroplan" → leave alone, or "British Airways" → fine).
 */

const CARRIER_DISPLAY_OVERRIDES: Record<string, string> = {
  aa: 'American Airlines',
  delta: 'Delta Air Lines',
  qatar: 'Qatar Airways',
  krisflyer: 'Singapore Airlines',
  turkish: 'Turkish Airlines',
  thai: 'Thai Airways',
  tap: 'TAP Air Portugal',
  cathay: 'Cathay Pacific',
  malaysia: 'Malaysia Airlines',
  // JAL is a single-row dual-role like AA — show airline name when rendered as carrier
  jal: 'Japan Airlines',
  // KLM / Air France / Lufthansa / etc. are already airline-named — no override needed
}

export function displayCarrierName(
  carrier: { slug?: string | null; name: string } | null | undefined,
): string {
  if (!carrier?.name) return 'Unknown carrier'
  if (carrier.slug && CARRIER_DISPLAY_OVERRIDES[carrier.slug]) {
    return CARRIER_DISPLAY_OVERRIDES[carrier.slug]
  }
  return carrier.name
}
