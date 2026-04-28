/**
 * Scout post-processing: for promo-shaped findings whose raw_text is too
 * thin to contain the qualifying terms (status tier, min nights, travel
 * window, exclusions, etc.), re-fetch the source URL via Firecrawl and
 * replace raw_text with the fuller article body.
 *
 * Why this is in Scout, not regenerate: thin raw_text bottlenecks the
 * writer + fact-checker before any human ever clicks Regenerate. Daily
 * brief approves can ship draft alerts whose qualifying terms were
 * never extracted because raw_text was a one-line RSS snippet. Fixing
 * upstream means every downstream consumer (writer, fact-checker,
 * brief, regenerate) sees richer text without coordinating.
 *
 * Cost discipline:
 *   - Only fires for promo-shaped alert types (the ones whose readers
 *     lose money on missing terms).
 *   - Only fires when raw_text < threshold characters — already-rich
 *     items skip the refetch.
 *   - Only fires when source_url is set.
 *   - Failures fall back to the original raw_text gracefully.
 *
 * Telemetry: returns counts so the Scout response can log how many
 * findings were enriched, skipped, or failed.
 */
import type { ScoutFinding } from './runScout'
import { fetchFirecrawl } from './firecrawl'

const PROMO_ALERT_TYPES = new Set<string>([
  'limited_time_offer',
  'transfer_bonus',
  'status_promo',
  'award_availability',
  'point_purchase',
])

const RAW_TEXT_MIN_CHARS = 500
const FIRECRAWL_MAX_CHARS = 6000

export interface PromoEnrichStats {
  candidates: number   // findings that matched (promo + thin raw_text)
  enriched: number     // candidates where Firecrawl returned more text and we replaced
  skipped: number      // candidates we didn't enrich (e.g. Firecrawl returned shorter content)
  failed: number       // Firecrawl returned empty / errored
}

function isPromoShaped(alertType: string | null | undefined): boolean {
  return !!alertType && PROMO_ALERT_TYPES.has(alertType)
}

function rawTextLen(f: ScoutFinding): number {
  return (f.raw_text ?? '').trim().length
}

/**
 * In-place enrich findings whose raw_text is thin AND alert_type is
 * promo-shaped. Returns the same array reference with mutated raw_text
 * on enriched items. Mutation is fine here: findings are short-lived
 * Scout-internal objects and the caller (run-scout/route.ts) inserts
 * them into intel_items immediately after.
 */
export async function enrichPromoFindings(
  findings: ScoutFinding[]
): Promise<PromoEnrichStats> {
  const stats: PromoEnrichStats = { candidates: 0, enriched: 0, skipped: 0, failed: 0 }

  for (const f of findings) {
    if (!isPromoShaped(f.alert_type)) continue
    if (rawTextLen(f) >= RAW_TEXT_MIN_CHARS) continue
    if (!f.source_url) continue
    stats.candidates++

    let body = ''
    try {
      body = await fetchFirecrawl(f.source_url, FIRECRAWL_MAX_CHARS)
    } catch (err) {
      // fetchFirecrawl already swallows + logs; this catches anything else.
      console.warn('[enrichPromoFindings] unexpected error:', err)
      stats.failed++
      continue
    }

    if (!body) {
      stats.failed++
      continue
    }

    if (body.length <= rawTextLen(f)) {
      // Firecrawl came back shorter than what we already had — keep the
      // RSS-supplied raw_text rather than degrade it.
      stats.skipped++
      continue
    }

    f.raw_text = body
    stats.enriched++
  }

  return stats
}
