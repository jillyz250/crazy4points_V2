/**
 * Auto-discover the best issuer page URL(s) for a credit card.
 *
 * Editor provides a starting URL (typically the issuer's homepage —
 * chase.com, americanexpress.com, etc.); this util:
 *   1. Calls Firecrawl /map (with search hints) to list crawlable URLs
 *   2. Filters to a card-relevant shortlist
 *   3. Sends shortlist + card name to Sonnet for classification
 *   4. Returns recommended main product URL + secondary URLs + Scout sources
 *
 * Smaller scope than the programs discovery — cards typically have ONE
 * main product page, not a full content tree. But the Scout-source
 * detection (issuer's offers + newsroom) still applies.
 */

import Anthropic from '@anthropic-ai/sdk'
import { mapFirecrawl } from '@/utils/ai/firecrawl'
import { logUsage } from '@/utils/ai/logUsage'
import { createAdminClient } from '@/utils/supabase/server'
import { checkUrl } from '@/utils/admin/checkUrl'

// URL classification is a simple categorization task — Haiku handles it at
// ~10% of Sonnet's cost. Switched during the cost-reduction pass.
const MODEL = 'claude-haiku-4-5-20251001'

// Drop noisy issuer-site paths
const SKIP_PATTERNS = [
  /\/careers/i,
  /\/jobs/i,
  /\/investor-relations/i,
  /\/privacy/i,
  /\/terms/i,
  /\/legal/i,
  /\/cookies/i,
  /\/accessibility/i,
  /\/help\/contact/i,
  /\/sitemap/i,
  /\/sustainability/i,
  /\.pdf$/i,
  /\/login/i,
  /\/sign-in/i,
  /\/atm-locator/i,
  /\/branch-locator/i,
]

// Rank these to the top — likely to be card-related
const KEEP_PATTERNS = [
  /credit-card/i,
  /creditcard/i,
  /card/i,
  /rewards/i,
  /points/i,
  /miles/i,
  /sapphire/i,
  /freedom/i,
  /platinum/i,
  /gold/i,
  /reserve/i,
  /preferred/i,
  /bonvoy/i,
  /world-of-hyatt/i,
  /hilton/i,
  /delta/i,
  /united/i,
  /southwest/i,
  /aadvantage/i,
  /venture/i,
  /spark/i,
  /quicksilver/i,
  /savor/i,
  /journey/i,
  /strata/i,
  /custom-cash/i,
  /double-cash/i,
  /bilt/i,
  /prestige/i,
  /benefits/i,
  /offers/i,
  /promo/i,
  /promotion/i,
  /bonus/i,
  /newsroom/i,
  /press[-_/]?release/i,
]

function shouldKeep(url: string): boolean {
  if (SKIP_PATTERNS.some((p) => p.test(url))) return false
  return true  // permissive — let Sonnet sort
}

function rankUrls(urls: string[]): string[] {
  const high: string[] = []
  const rest: string[] = []
  for (const u of urls) {
    if (KEEP_PATTERNS.some((p) => p.test(u))) high.push(u)
    else rest.push(u)
  }
  return [...high, ...rest]
}

const DISCOVERY_SYSTEM_PROMPT = `You are mapping discovered URLs on a credit card issuer's site to specific roles for an automated extraction pipeline.

You receive: card name, issuer name, and a shortlist of candidate URLs from the issuer's site.

You return:
- source_url: the SINGLE best official product page for the card (where annual fee, welcome bonus, earn rates, and benefits are documented).
- guide_to_benefits_url: optional secondary page with detailed benefits (often a PDF — return null if you don't see one).
- pricing_terms_url: optional THIRD page with Schumer-box / pricing & terms info — FX fee, APR ranges, late fees, penalty APR, returned-payment fee. Often a separate "Pricing & Terms" or "Cardmember Agreement" page (e.g. creditcards.chase.com/.../<card>/pricing-and-terms or "rates and fees" link). Return null if you don't see one.
- promo_source: the issuer's current offers / bonus miles / current promotions page (time-sensitive content for the alerts pipeline, NOT for the card page).
- newsroom_source: the issuer's CONSUMER newsroom (e.g. news.americanexpress.com, hub.united.com/newsroom). AVOID investor-relations subdomains.

KNOWN PROMO + NEWSROOM URL PATTERNS (use as fallback when explicit candidate is missing):
- Chase: promo_source = creditcards.chase.com/newest-offers-credit-cards | newsroom_source = media.chase.com/news/*
- American Express: promo_source = americanexpress.com/.../current-offers OR americanexpress.com/.../offers
                    newsroom_source = news.americanexpress.com or about.americanexpress.com/news
- Citi: promo_source = citi.com/.../credit-cards-offers | newsroom_source = citigroup.com/global/news
- Capital One: promo_source = capitalone.com/credit-cards/.../offers | newsroom_source = capitalone.com/about/newsroom
- Barclays: promo_source = cards.barclaycardus.com (issuer-wide) | newsroom_source = home.barclays/news
- Bank of America: newsroom_source = about.bankofamerica.com/en/making-an-impact (consumer-facing)
- Wells Fargo: newsroom_source = newsroom.wf.com (yes — wf, not wellsfargo)
- US Bank: newsroom_source = usbank.com/newsroom

CRITICAL — SOURCE_URL DOMAIN RULE:
- source_url MUST be on the ISSUER's own domain (chase.com, americanexpress.com, etc.)
- For cobrand cards (Chase Marriott, Chase United, Amex Hilton, etc.) the SOURCE URL is the
  ISSUER's product page (creditcards.chase.com/...), NOT the brand partner's marketing page
  (traveler.marriott.com/..., united.com/credit-cards/..., etc.). Brand-partner pages are
  marketing aggregators that cover multiple products and aren't authoritative for extraction.

RULES:
1. Return ONLY URLs you saw in the candidate list. Don't invent URLs.
2. source_url should be a card-specific product page on the ISSUER's domain (see rule above).
3. If no perfect candidate exists for a slot, return null for that slot.
4. Confidence: high / medium / low based on URL-name match to card.
5. For promo_source + newsroom_source: if no card-specific candidate exists, return the
   issuer-wide URL from the KNOWN URL PATTERNS list above (those serve all the issuer's cards).

OUTPUT: call submit_discovery with the structured fields.`

function buildUserPrompt(cardName: string, issuerName: string, urls: string[]): string {
  return `Card: ${cardName}
Issuer: ${issuerName}

Candidate URLs (${urls.length} total):
${urls.map((u) => `- ${u}`).join('\n')}

Return source_url + secondary URLs + Scout sources per the system prompt.`
}

export type CardDiscoveryResult =
  | {
      ok: true
      suggestions: {
        source_url?: { url: string; reason: string; confidence: string } | null
        guide_to_benefits_url?: { url: string; reason: string; confidence: string } | null
        pricing_terms_url?: { url: string; reason: string; confidence: string } | null
        promo_source?: { url: string; reason: string; confidence: string } | null
        newsroom_source?: { url: string; reason: string; confidence: string } | null
      }
      total_urls_seen: number
      candidates_sent_to_sonnet: number
      starting_url: string
    }
  | { ok: false; error: string }

export async function discoverCardSourceUrl({
  cardId,
  cardName,
  issuerName,
  startingUrl,
}: {
  cardId: string
  cardName: string
  issuerName: string
  startingUrl: string
}): Promise<CardDiscoveryResult> {
  if (!startingUrl?.trim()) {
    return { ok: false, error: 'Starting URL required (e.g. https://www.chase.com)' }
  }

  let url = startingUrl.trim()
  if (!url.startsWith('http')) url = `https://${url}`

  // Multi-pass /map: plain + search-augmented
  const [plain, searched] = await Promise.all([
    mapFirecrawl(url, { limit: 500 }),
    mapFirecrawl(url, {
      search: `${cardName} credit card benefits`,
      limit: 200,
    }),
  ])
  const allUrls = Array.from(new Set([...plain, ...searched]))

  if (allUrls.length === 0) {
    return { ok: false, error: `Firecrawl /map returned no URLs for ${url}` }
  }

  const filtered = rankUrls(allUrls.filter(shouldKeep)).slice(0, 100)
  if (filtered.length === 0) {
    return { ok: false, error: `No candidate URLs matched. Try a more specific starting URL.` }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not set' }

  const client = new Anthropic({ apiKey })

  const discoveryTool = {
    name: 'submit_discovery',
    description: 'Submit recommended URLs for the card',
    input_schema: {
      type: 'object' as const,
      properties: {
        source_url: {
          anyOf: [
            {
              type: 'object',
              properties: {
                url: { type: 'string' },
                reason: { type: 'string' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['url', 'reason', 'confidence'],
            },
            { type: 'null' },
          ],
        },
        guide_to_benefits_url: {
          anyOf: [
            {
              type: 'object',
              properties: {
                url: { type: 'string' },
                reason: { type: 'string' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['url', 'reason', 'confidence'],
            },
            { type: 'null' },
          ],
        },
        pricing_terms_url: {
          anyOf: [
            {
              type: 'object',
              properties: {
                url: { type: 'string' },
                reason: { type: 'string' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['url', 'reason', 'confidence'],
            },
            { type: 'null' },
          ],
        },
        promo_source: {
          anyOf: [
            {
              type: 'object',
              properties: {
                url: { type: 'string' },
                reason: { type: 'string' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['url', 'reason', 'confidence'],
            },
            { type: 'null' },
          ],
        },
        newsroom_source: {
          anyOf: [
            {
              type: 'object',
              properties: {
                url: { type: 'string' },
                reason: { type: 'string' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['url', 'reason', 'confidence'],
            },
            { type: 'null' },
          ],
        },
      },
    },
  }

  let response
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: DISCOVERY_SYSTEM_PROMPT,
      tools: [discoveryTool],
      tool_choice: { type: 'tool', name: 'submit_discovery' },
      messages: [{ role: 'user', content: buildUserPrompt(cardName, issuerName, filtered) }],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Sonnet error: ${message}` }
  }

  await logUsage(response, 'card_url_discovery', { card_id: cardId })

  const toolUseBlock = response.content.find(
    (c): c is Extract<typeof c, { type: 'tool_use' }> => c.type === 'tool_use',
  )
  if (!toolUseBlock) {
    return { ok: false, error: 'Sonnet did not call submit_discovery' }
  }

  type Suggestions = {
    source_url?: { url: string; reason: string; confidence: string } | null
    guide_to_benefits_url?: { url: string; reason: string; confidence: string } | null
    pricing_terms_url?: { url: string; reason: string; confidence: string } | null
    promo_source?: { url: string; reason: string; confidence: string } | null
    newsroom_source?: { url: string; reason: string; confidence: string } | null
  }
  const suggestions = (toolUseBlock.input ?? {}) as Suggestions

  // Verify each suggested URL with a HEAD request before surfacing to the
  // editor. Drops dead suggestions to null so the editor only sees verified
  // URLs — kills the "suggested URL turns out to be a 404" class of bugs.
  //
  // Exception: 403/401 ("forbidden") from CDN bot-blocking (Citi, AA,
  // Southwest, JetBlue all run Akamai or similar) is NOT a real "URL is
  // dead" signal — Firecrawl reaches these fine when the editor actually
  // scrapes them. Without this exception, the Discover URL flow returned
  // all-null suggestions for every Citi card because every URL came back
  // 403 from plain HEAD even though they're real, scrapeable pages.
  // Same pattern would have killed the flow for AA / Southwest co-brands.
  const slots: Array<keyof Suggestions> = [
    'source_url',
    'guide_to_benefits_url',
    'pricing_terms_url',
    'promo_source',
    'newsroom_source',
  ]
  await Promise.all(
    slots.map(async (slot) => {
      const entry = suggestions[slot]
      if (!entry?.url) return
      const result = await checkUrl(entry.url)
      if (!result.ok && result.reason !== 'forbidden') {
        suggestions[slot] = null
      }
    }),
  )

  const supabase = createAdminClient()
  const payload: Record<string, unknown> = {
    ...suggestions,
    generated_at: new Date().toISOString(),
    starting_url: url,
    total_urls_seen: allUrls.length,
    candidates_sent: filtered.length,
  }
  // Try to persist if column exists; ignore error if it doesn't yet
  await supabase
    .from('credit_cards')
    .update({ suggested_field_urls: payload })
    .eq('id', cardId)

  return {
    ok: true,
    suggestions,
    total_urls_seen: allUrls.length,
    candidates_sent_to_sonnet: filtered.length,
    starting_url: url,
  }
}
