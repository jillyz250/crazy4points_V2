/**
 * Auto-discover the right source URLs per extraction field for a program.
 *
 * Editor provides a starting URL (e.g. https://www.united.com); this util:
 *   1. Calls Firecrawl /map to get all crawlable URLs on the domain
 *   2. Filters to a relevance shortlist (drops obvious irrelevance like
 *      /careers, /investor-relations, /privacy, etc.)
 *   3. Sends the shortlist + each URL's title (best-effort) to Sonnet with
 *      our field schema; asks for a per-field URL recommendation
 *   4. Persists the result to programs.suggested_field_urls
 *
 * Editor reviews on the extract page and copies/applies suggestions.
 */

import Anthropic from '@anthropic-ai/sdk'
import { mapFirecrawl } from '@/utils/ai/firecrawl'
import { logUsage } from '@/utils/ai/logUsage'
import { createAdminClient } from '@/utils/supabase/server'

const MODEL = 'claude-sonnet-4-6'

// URL patterns we always skip — common non-program pages on big-brand domains.
const SKIP_PATTERNS = [
  /\/careers/i,
  /\/jobs/i,
  /\/investor-relations/i,
  /\/about-us\/leadership/i,
  /\/privacy/i,
  /\/terms/i,
  /\/legal/i,
  /\/cookies/i,
  /\/accessibility/i,
  /\/contact/i,
  /\/help\/contact/i,
  /\/sitemap/i,
  /\/press/i,
  /\/newsroom/i,
  /\/media-center/i,
  /\/corporate/i,
  /\/sustainability/i,
  /\/community/i,
  /\/diversity/i,
  /\/safety$/i,
  /\.pdf$/i,
  /\.jpg$/i,
  /\.png$/i,
  /\.gif$/i,
  /\/login/i,
  /\/sign-in/i,
  /\/account$/i,
  /\/manage-reservations/i,
  /\/check-in/i,
  /\/baggage\/checked/i,
  /\/baggage\/carry-on/i,
  /\/seat-map/i,
]

// Keep patterns boost relevance: URL contains any of these → high-priority
const KEEP_PATTERNS = [
  /miles/i,
  /points/i,
  /rewards/i,
  /loyalty/i,
  /elite/i,
  /premier/i,
  /status/i,
  /tier/i,
  /lounge/i,
  /club/i,
  /award/i,
  /partner/i,
  /alliance/i,
  /benefit/i,
  /transfer/i,
  /chart/i,
  /redemption/i,
  /sweet/i,
  /promo/i,
  /offer/i,
  /about/i,
  /program/i,
  /flying-blue/i,
  /mileage/i,
  /skymiles/i,
  /aadvantage/i,
  /aeroplan/i,
  /bonvoy/i,
  /honors/i,
  /one-rewards/i,
  /world-of-hyatt/i,
]

function shouldKeep(url: string): boolean {
  if (SKIP_PATTERNS.some((p) => p.test(url))) return false
  if (KEEP_PATTERNS.some((p) => p.test(url))) return true
  return false  // Strict: must match a KEEP pattern
}

const DISCOVERY_SYSTEM_PROMPT = `You are mapping discovered URLs on a points-and-miles program's marketing site to specific content fields on a reference page.

You receive: program name, program type (airline/hotel/alliance/credit_card), and a shortlist of candidate URLs from the program's official site.

You return: a JSON map of which URL best supports each extraction field.

EXTRACTION FIELDS:
- intro: short narrative paragraph. Usually skipped (editorial). Return null unless the page is a clear program-overview.
- sweet_spots: redemption highlights. Usually skipped (editorial). Return null unless the page is a clear "best redemptions" or "deals" page.
- lounge_access: airport lounge access rules (alliance/cabin/status-based). Look for "Lounge", "Club", "Polaris", "Admirals", "Sky Club", "Centurion", etc.
- quirks: program quirks, recent changes, fine print, what's new. Look for "What's New", "About [program]", "Program Updates", "Recent changes".
- award_chart: redemption costs by region/cabin. SKIP if program is dynamic-pricing (United, Delta, JetBlue, Southwest, AA, Air Canada Aeroplan partial, Hilton). For chart programs (Avianca, ANA, Singapore, Air France/KLM Flying Blue partial, Hyatt), find the "Award Chart" or "Redemption Calculator" page.
- alliance: alliance membership info. Usually a single landing page. SKIP for alliance-type programs themselves.
- hubs: hub airport list. Usually on the airline's main "About" or route map page. Rare standalone page.
- parent_program_slug: only relevant for sub-programs (e.g. KLM under Flying Blue, Iberia under Avios). Return null for standalone programs.
- tier_benefits: status tier benefits per level (Silver/Gold/Premier 1K/Platinum/etc). Look for "Elite Status", "Premier", "Medallion", "Loyalty Tiers", "Status Benefits".

RULES:
1. Return ONLY URLs that you saw in the candidate list. Don't invent URLs.
2. Up to 2 URLs per field if multiple pages cover the topic (e.g. tier_benefits often spans /benefits and /qualify pages).
3. Confidence levels: "high" (URL clearly matches), "medium" (URL probably matches), "low" (URL might match but unsure).
4. Skip fields where no candidate URL is a good match — return null for that field.
5. For SKIP-by-default fields (intro, sweet_spots, award_chart on dynamic-pricing programs), return null unless an obviously-perfect URL exists.
6. Reason should be 1 sentence: what about the URL/path made you pick it.

OUTPUT FORMAT — return ONLY valid JSON, no prose:
{
  "tier_benefits": { "urls": ["..."], "reason": "...", "confidence": "high" } | null,
  "lounge_access": { ... } | null,
  "quirks": { ... } | null,
  "award_chart": { ... } | null,
  "alliance": { ... } | null,
  "hubs": { ... } | null,
  "parent_program_slug": { ... } | null,
  "intro": { ... } | null,
  "sweet_spots": { ... } | null
}`

function buildUserPrompt(
  programName: string,
  programType: string,
  candidateUrls: string[],
): string {
  return `Program: ${programName}
Type: ${programType}

Candidate URLs from the site map (${candidateUrls.length} total):
${candidateUrls.map((u) => `- ${u}`).join('\n')}

Return the JSON map per the system prompt. Pick the best URL(s) per field; null any field where no good candidate exists.`
}

export type DiscoveryFieldSuggestion = {
  urls: string[]
  reason: string
  confidence: 'high' | 'medium' | 'low'
}

export type DiscoveryResult =
  | {
      ok: true
      suggestions: Record<string, DiscoveryFieldSuggestion | null>
      total_urls_seen: number
      candidates_sent_to_sonnet: number
      starting_url: string
    }
  | { ok: false; error: string }

export async function discoverSourceUrls({
  programId,
  programName,
  programType,
  startingUrl,
}: {
  programId: string
  programName: string
  programType: string
  startingUrl: string
}): Promise<DiscoveryResult> {
  if (!startingUrl?.trim()) {
    return { ok: false, error: 'Starting URL required (e.g. https://www.united.com)' }
  }

  // Normalize starting URL
  let url = startingUrl.trim()
  if (!url.startsWith('http')) url = `https://${url}`

  // 1. Get site map
  const allUrls = await mapFirecrawl(url, { limit: 200 })
  if (allUrls.length === 0) {
    return { ok: false, error: `Firecrawl /map returned no URLs for ${url} — check the starting URL or domain reachability` }
  }

  // 2. Filter to relevance shortlist (max ~80 for Sonnet context)
  const filtered = allUrls.filter(shouldKeep).slice(0, 80)
  if (filtered.length === 0) {
    return {
      ok: false,
      error: `No candidate URLs matched relevance patterns out of ${allUrls.length} discovered. Try a more specific starting URL like the program's loyalty-program landing page.`,
    }
  }

  // 3. Sonnet classification
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not set' }

  const client = new Anthropic({ apiKey })

  let response
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: DISCOVERY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(programName, programType, filtered) }],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Sonnet error: ${message}` }
  }

  await logUsage(response, 'program_url_discovery', { program_id: programId })

  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return { ok: false, error: 'Sonnet returned no text content' }
  }

  let raw = textBlock.text.trim()
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

  let parsed: Record<string, DiscoveryFieldSuggestion | null>
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Could not parse Sonnet JSON: ${msg}` }
  }

  // 4. Persist
  const supabase = createAdminClient()
  const payload = {
    ...parsed,
    generated_at: new Date().toISOString(),
    starting_url: url,
    total_urls_seen: allUrls.length,
    candidates_sent: filtered.length,
  }

  const { error: updateErr } = await supabase
    .from('programs')
    .update({ suggested_field_urls: payload })
    .eq('id', programId)

  if (updateErr) {
    return { ok: false, error: `Persist failed: ${updateErr.message}` }
  }

  return {
    ok: true,
    suggestions: parsed,
    total_urls_seen: allUrls.length,
    candidates_sent_to_sonnet: filtered.length,
    starting_url: url,
  }
}
