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
  /bonus/i,
  /deal/i,
  /sale/i,
  /newsroom/i,
  /press[-_/]?release/i,
  /news[-_/]?center/i,
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
  // Only enforce SKIP. Keep everything else and let Sonnet sort it out —
  // big airline domains are mostly /destinations/<city> pages that don't
  // match KEEP regex but also aren't worth filtering at this stage.
  return true
}

// Re-rank URLs: pages matching KEEP_PATTERNS go to top of the list so Sonnet
// sees them first when the candidate count is capped.
function rankUrls(urls: string[]): string[] {
  const keepUrls: string[] = []
  const otherUrls: string[] = []
  for (const u of urls) {
    if (KEEP_PATTERNS.some((p) => p.test(u))) keepUrls.push(u)
    else otherUrls.push(u)
  }
  return [...keepUrls, ...otherUrls]
}

const DISCOVERY_SYSTEM_PROMPT = `You are mapping discovered URLs on a points-and-miles program's marketing site to specific content fields on a reference page AND identifying time-sensitive Scout-source pages for the alerts pipeline.

You receive: program name, program type (airline/hotel/alliance/credit_card), and a shortlist of candidate URLs from the program's official site.

You return: a JSON map of which URL best supports each extraction field, plus Scout-source recommendations.

EXTRACTION FIELDS (static program-page content):
- intro: short narrative paragraph. Usually skipped (editorial). Return null unless the page is a clear program-overview.
- sweet_spots: redemption highlights. Usually skipped (editorial). Return null unless the page is a clear "best redemptions" or "deals" page.
- lounge_access: airport lounge access rules (alliance/cabin/status-based). Look for "Lounge", "Club", "Polaris", "Admirals", "Sky Club", "Centurion", etc.
- quirks: program quirks, recent changes, fine print, what's new. Look for "What's New", "About [program]", "Program Updates", "Recent changes".
- award_chart: redemption costs by region/cabin. SKIP if program is dynamic-pricing (United, Delta, JetBlue, Southwest, AA, Air Canada Aeroplan partial, Hilton). For chart programs (Avianca, ANA, Singapore, Air France/KLM Flying Blue partial, Hyatt), find the "Award Chart" or "Redemption Calculator" page.
- alliance: alliance membership info. Usually a single landing page. SKIP for alliance-type programs themselves.
- hubs: hub airport list. Usually on the airline's main "About" or route map page. Rare standalone page.
- parent_program_slug: only relevant for sub-programs (e.g. KLM under Flying Blue, Iberia under Avios). Return null for standalone programs.
- tier_benefits: status tier benefits per level (Silver/Gold/Premier 1K/Platinum/etc). Look for "Elite Status", "Premier", "Medallion", "Loyalty Tiers", "Status Benefits".

SCOUT SOURCES (time-sensitive content for the alerts pipeline — NOT for static program-page content):
- promo_source: the program's "Current Offers" / "Promotions" / "Bonus Miles" page. Examples: united.com/.../mp-offers.html, delta.com/.../skymiles-offers.html, marriott.com/.../current-promotions.mi. Time-sensitive content; bonuses change weekly.
- newsroom_source: the airline/program's CONSUMER newsroom or press-release hub. Examples: hub.united.com/newsroom, news.delta.com, newsroom.marriott.com, news.flyfrontier.com. AVOID investor-relations subdomains like ir.united.com or investor.delta.com — those are SEC filings + earnings, NOT consumer-facing program news. If only an IR URL is in candidates, return null for newsroom_source.

RULES:
1. Return ONLY URLs that you saw in the candidate list. Don't invent URLs.
2. Up to 2 URLs per field if multiple pages cover the topic.
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
  "sweet_spots": { ... } | null,
  "promo_source": { "urls": ["..."], "reason": "...", "confidence": "high" } | null,
  "newsroom_source": { "urls": ["..."], "reason": "...", "confidence": "high" } | null
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

  // 1. Get site map. Three-pass:
  //    a) Plain /map on starting URL (catches general structure).
  //    b) /map with search="elite tier lounge benefits" — Firecrawl filters
  //       returned URLs by content-relevance to the search query.
  //    c) After identifying the loyalty-hub URL in the combined results,
  //       /map that hub deeply too.
  //    Combine + dedupe across all three.
  const [primaryUrls, searchedUrls] = await Promise.all([
    mapFirecrawl(url, { limit: 500 }),
    mapFirecrawl(url, {
      search: 'elite tier status benefits lounge club award redemption',
      limit: 200,
    }),
  ])

  // Find the strongest loyalty-program landing-page candidate to deep-crawl
  const LOYALTY_HUB_PATTERNS = [
    /\/mileageplus[^\/]*$/i,
    /\/mileageplus\.html?$/i,
    /\/skymiles[^\/]*$/i,
    /\/aadvantage[^\/]*$/i,
    /\/aeroplan[^\/]*$/i,
    /\/flying-?blue[^\/]*$/i,
    /\/krisflyer[^\/]*$/i,
    /\/bonvoy[^\/]*$/i,
    /\/honors[^\/]*$/i,
    /\/one-?rewards[^\/]*$/i,
    /\/world-?of-?hyatt[^\/]*$/i,
    /\/wyndham-?rewards[^\/]*$/i,
    /\/(loyalty|rewards|frequent[-_]?flyer|members?)[^\/]*\.(html?|aspx?)?$/i,
  ]
  const combinedPrimary = Array.from(new Set([...primaryUrls, ...searchedUrls]))
  const deepStarter = combinedPrimary.find((u) =>
    LOYALTY_HUB_PATTERNS.some((p) => p.test(u)),
  )

  let secondaryUrls: string[] = []
  let secondarySearched: string[] = []
  if (deepStarter && deepStarter !== url) {
    ;[secondaryUrls, secondarySearched] = await Promise.all([
      mapFirecrawl(deepStarter, { limit: 500 }),
      mapFirecrawl(deepStarter, {
        search: 'premier elite tier lounge club benefits qualify award',
        limit: 200,
      }),
    ])
  }

  // Dedupe combined list across all four passes
  const allUrls = Array.from(
    new Set([...combinedPrimary, ...secondaryUrls, ...secondarySearched]),
  )
  if (allUrls.length === 0) {
    return { ok: false, error: `Firecrawl /map returned no URLs for ${url} — check the starting URL or domain reachability` }
  }

  // 2. Drop obviously-irrelevant URLs (careers, privacy, etc.), then rank
  //    KEEP-pattern URLs to the top, then cap at 100 for Sonnet's context.
  const filtered = rankUrls(allUrls.filter(shouldKeep)).slice(0, 100)
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
