/**
 * Free Night Certificate definitions for the Will My FNC Fit? tool.
 *
 * Two matching models:
 *   - Points-based (Marriott, IHG): cert covers any property whose
 *     standard_points is at or below the cap. Topup allowed up to the
 *     program's topup limit.
 *   - Category-based (Hyatt): cert covers any property at or below a
 *     given category, regardless of off-peak/standard/peak rate.
 */

export type CertMatchModel = 'points' | 'category'

export interface CertDef {
  id: string
  label: string
  programSlug: string // program slug to look up in `programs` table
  matchModel: CertMatchModel
  /** Points cap (for points-based certs). */
  maxPoints?: number
  /** Max topup points allowed (points-based only). 0 = no topup. */
  topupMax?: number
  /** Maximum category covered (category-based certs only). */
  maxCategory?: number
  /** Display fees note. */
  feesNote?: string
  /** One-line expiry hint surfaced on the result card. Phrased
   *  conservatively ("typically X — check your account") because
   *  individual cert expiries vary by issue date + program extensions.
   *  The whole point of this tool is to beat expiry, so this can't
   *  be silent. */
  expiryHint?: string
  /** When false, the cert renders as a disabled "Coming soon" option
   *  in the form because the program's hotel_properties data isn't
   *  loaded in Supabase yet. Picking it via URL still routes through
   *  the page, where a coming-soon message replaces the result. */
  available?: boolean
}

export const FNC_CERTS: CertDef[] = [
  // Marriott top-up cap moved from 15k → 25k in March 2026.
  // Source: https://thepointsguy.com/news/marriott-free-night-award-certificates-top-up-25000-points/
  // Source: marriott.com/loyalty/redeem/free-night-award-redemption.mi
  {
    id: 'marriott-35k',
    label: '35k Marriott Free Night Cert',
    programSlug: 'marriott-bonvoy',
    matchModel: 'points',
    maxPoints: 35000,
    topupMax: 25000,
    feesNote: 'You can top up with up to 25,000 of your own points (cap raised from 15,000 in March 2026).',
    expiryHint: 'Marriott Free Night Awards typically expire 12 months from when they post. Check your Marriott Bonvoy account for the exact date.',
  },
  {
    id: 'marriott-50k',
    label: '50k Marriott Free Night Cert',
    programSlug: 'marriott-bonvoy',
    matchModel: 'points',
    maxPoints: 50000,
    topupMax: 25000,
    feesNote: 'You can top up with up to 25,000 of your own points (cap raised from 15,000 in March 2026).',
    expiryHint: 'Marriott Free Night Awards typically expire 12 months from when they post. Check your Marriott Bonvoy account for the exact date.',
  },
  {
    id: 'marriott-85k',
    label: '85k Marriott Free Night Cert',
    programSlug: 'marriott-bonvoy',
    matchModel: 'points',
    maxPoints: 85000,
    topupMax: 25000,
    feesNote: 'You can top up with up to 25,000 of your own points (cap raised from 15,000 in March 2026).',
    expiryHint: 'Marriott Free Night Awards typically expire 12 months from when they post. Check your Marriott Bonvoy account for the exact date.',
  },
  // Hyatt expiry varies by source: credit-card and Brand Explorer = 12
  // months; Milestone Rewards = 180 days. Critical nuance: the full STAY
  // must complete before expiry, not just be booked.
  // Source: https://www.hyatt.com/help/faqs/world-of-hyatt-awards
  // Source: https://www.nerdwallet.com/travel/learn/hyatt-how-to-use-free-night-awards
  {
    id: 'hyatt-1-4',
    label: 'Hyatt Category 1-4 Free Night',
    programSlug: 'hyatt',
    matchModel: 'category',
    maxCategory: 4,
    feesNote: 'Covers any Cat 1-4 property regardless of peak / standard / off-peak.',
    expiryHint: 'Hyatt Free Night Awards expire 12 months from issue (credit card / Brand Explorer) or 180 days (Milestone Rewards). Your full stay must be completed before expiry — not just booked. Check your World of Hyatt account for the exact date.',
  },
  {
    id: 'hyatt-1-7',
    label: 'Hyatt Category 1-7 Free Night',
    programSlug: 'hyatt',
    matchModel: 'category',
    maxCategory: 7,
    feesNote: 'Covers any Cat 1-7 property regardless of peak / standard / off-peak.',
    expiryHint: 'Hyatt Free Night Awards expire 12 months from issue (credit card / Brand Explorer) or 180 days (Milestone Rewards). Your full stay must be completed before expiry — not just booked. Check your World of Hyatt account for the exact date.',
  },
  // IHG anniversary cert: 12 months from issue, top-up with points OR
  // points+cash, full stay must complete before expiry.
  // Source: https://thepointsguy.com/loyalty-programs/ihg-award-night-certificate/
  // Source: https://www.ihg.com/onerewards/content/us/en/creditcard
  {
    id: 'ihg-anniv',
    label: 'IHG Anniversary Free Night',
    programSlug: 'ihg',
    matchModel: 'points',
    maxPoints: 40000,
    topupMax: 999_000,
    feesNote: 'Top up with additional points or points + cash. Covers room + taxes (not resort/parking fees).',
    expiryHint: 'IHG Anniversary Free Nights expire 12 months from issue. Your full stay must be completed before expiry — not just booked. Check your IHG One Rewards account for the exact date.',
    // IHG property data not yet loaded in Supabase. Selecting this cert
    // surfaces a "coming soon" message instead of running the lookup.
    available: false,
  },
]

export function findCert(id: string): CertDef | null {
  return FNC_CERTS.find((c) => c.id === id) ?? null
}

export type FitVerdict = 'fits' | 'fits_with_topup' | 'doesnt_fit'

export interface FitResult {
  verdict: FitVerdict
  topupPoints?: number // when fits_with_topup
  valueRating: 'great' | 'good' | 'wasting' | 'unknown'
}

/**
 * Compute whether a property fits the cert and provide a value rating.
 * Pure function — UI just renders the result.
 */
export function computeFit(
  cert: CertDef,
  property: {
    category: string | null
    standard_points: number | null
    off_peak_points: number | null
    peak_points: number | null
  },
): FitResult {
  if (cert.matchModel === 'category') {
    const cat = parseInt(property.category ?? '', 10)
    if (isNaN(cat))
      return { verdict: 'doesnt_fit', valueRating: 'unknown' }
    if (cat <= (cert.maxCategory ?? 0)) {
      // Value rating: closer to cert cap = better use
      const ratio = cat / (cert.maxCategory ?? 1)
      const valueRating =
        ratio > 0.85 ? 'great' : ratio > 0.5 ? 'good' : 'wasting'
      return { verdict: 'fits', valueRating }
    }
    return { verdict: 'doesnt_fit', valueRating: 'unknown' }
  }

  // Points model
  const standard = property.standard_points
  if (standard == null) {
    return { verdict: 'doesnt_fit', valueRating: 'unknown' }
  }
  const cap = cert.maxPoints ?? 0
  if (standard <= cap) {
    const ratio = standard / cap
    const valueRating =
      ratio > 0.85 ? 'great' : ratio > 0.5 ? 'good' : 'wasting'
    return { verdict: 'fits', valueRating }
  }
  // Doesn't fit at standard; check topup
  const topupMax = cert.topupMax ?? 0
  const shortfall = standard - cap
  if (topupMax >= shortfall) {
    return {
      verdict: 'fits_with_topup',
      topupPoints: shortfall,
      valueRating: shortfall < 5000 ? 'great' : 'good',
    }
  }
  return { verdict: 'doesnt_fit', valueRating: 'unknown' }
}
