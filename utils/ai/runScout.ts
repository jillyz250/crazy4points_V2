import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'
import type { Source, AlertType, IntelConfidence } from '@/utils/supabase/queries'
import { fetchFirecrawl } from './firecrawl'

export interface ScoutFinding {
  source_url?: string
  source_type: 'official' | 'blog' | 'reddit' | 'social'
  source_name: string
  raw_text?: string
  headline: string
  description?: string
  confidence: IntelConfidence
  alert_type?: AlertType
  programs?: string[]
  start_date?: string
  expires_at?: string
}

interface SourceContent {
  source: Source
  content: string
}

async function fetchRSS(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'crazy4points-scout/1.0' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return ''
  const text = await res.text()
  // Strip XML tags, keep readable content (titles + descriptions)
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<(?!title|description)[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 3000)
}

async function fetchReddit(subreddit: string): Promise<string> {
  const name = subreddit.replace('https://www.reddit.com/r/', '').replace('/', '')
  const res = await fetch(
    `https://www.reddit.com/r/${name}/hot.json?limit=25&t=day`,
    { headers: { 'User-Agent': 'crazy4points-scout/1.0' }, signal: AbortSignal.timeout(10000) }
  )
  if (!res.ok) return ''
  const json = await res.json()
  const posts = json?.data?.children ?? []
  return posts
    .map((p: { data: { title: string; score: number; selftext?: string } }) =>
      `[${p.data.score}] ${p.data.title}${p.data.selftext ? ': ' + p.data.selftext.slice(0, 200) : ''}`
    )
    .join('\n')
    .slice(0, 3000)
}

async function fetchPlainHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'crazy4points-scout/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return ''
    const text = await res.text()
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 2000)
  } catch {
    return ''
  }
}

async function fetchSource(source: Source): Promise<string> {
  try {
    if (source.type === 'community') return await fetchReddit(source.url)
    if (source.type === 'blog') return await fetchRSS(source.url)

    // Official pages: prefer Firecrawl (renders JS) when flagged, fall back to plain fetch
    if (source.use_firecrawl) {
      const md = await fetchFirecrawl(source.url)
      if (md.length > 100) return md
      console.warn(`[runScout] Firecrawl returned empty for ${source.name}, falling back to plain fetch`)
    }

    return await fetchPlainHtml(source.url)
  } catch {
    return ''
  }
}

export interface ScoutProgram {
  slug: string
  name: string
  type: string // credit_card | airline | hotel | ...
}

export async function runScout(
  sources: Source[],
  recentHeadlines: string[] = [],
  programs: ScoutProgram[] = []
): Promise<ScoutFinding[]> {
  const client = new Anthropic()

  // Fetch all sources in parallel
  const contents: SourceContent[] = await Promise.all(
    sources
      .filter((s) => s.is_active)
      .map(async (source) => ({
        source,
        content: await fetchSource(source),
      }))
  )

  const sourceSummaries = contents
    .filter((c) => c.content.length > 50)
    .map((c) => `### ${c.source.name} (${c.source.type})\n${c.content}`)
    .join('\n\n---\n\n')

  const today = new Date().toISOString().split('T')[0]

  const knownSection = recentHeadlines.length > 0
    ? `\nALREADY KNOWN (last 7 days — skip unless there is a major new development):\n${recentHeadlines.map((h) => `- ${h}`).join('\n')}\n`
    : ''

  const programList = programs.length > 0
    ? programs.map((p) => `- ${p.slug} (${p.name}, ${p.type})`).join('\n')
    : '- chase-ur, amex-mr, citi-thankyou, capital-one, hyatt, aa-aadvantage, united-mileageplus, delta-skymiles, marriott-bonvoy, hilton-honors, ihg'

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `You are Claude Scout, an intelligence agent for crazy4points.com — a loyalty points & miles alert site.

Today is ${today}. Analyze the following source content and extract actionable intel items about loyalty programs (transfer bonuses, award chart changes, promos, devaluations, new partners, limited-time offers, etc.).

RULES:
- Only report concrete, specific findings — no vague "program X may change" speculation
- confidence: "high" = official source or 3+ credible blogs confirming; "medium" = 1–2 credible sources; "low" = Reddit rumor/speculation
- Deduplicate: if the same story appears in multiple sources, output ONE finding with the highest confidence
- Skip findings that are clearly old news (>7 days) or evergreen advice articles
- programs array: pick slugs ONLY from the PROGRAM LIST below. If the right slug isn't listed, omit it rather than invent one.
- PROGRAM ORDER MATTERS: the FIRST slug in the array becomes the alert's primary program; the rest become secondary. Pick primary using these rules:
  • partner_change / alliance / acquisition: primary = the program whose status CHANGED (e.g., Hawaiian joins oneworld → primary = "atmos"; partners gaining access go secondary).
  • transfer_bonus: primary = the source currency (the one transferring OUT), secondary = the destination. Example: Chase→Hyatt 30% bonus → ["chase-ur", "hyatt"].
  • co-branded card news (new card, refresh, signup bonus): primary = the issuing bank/currency, secondary = the co-brand. Example: Chase Hyatt card refresh → ["chase-ur", "hyatt"].
  • award sale / award availability / devaluation: primary = the operating loyalty program running the sale or being devalued.
  • status_promo / earn_rate_change / policy_change: primary = the program making the change.
  • industry_news with no single actor: primary = the program most central to the reader action.
- CO-BRANDED CARDS: tag BOTH the issuer AND the airline/hotel (see order rule above).
- TRANSFER BONUSES: tag both source and destination (see order rule above).
- AIRLINE/HOTEL AWARD SALES: always tag the operating loyalty program (e.g., SAS award sale → ["sas-eurobonus"] if listed).
- Never return an empty programs array unless the finding truly has no loyalty angle.

PROGRAM LIST (authoritative — use these slugs):
${programList}
ALERT TYPE — pick exactly ONE from the 17 below. Definitions + tie-breakers:

OFFERS (reader action: grab it now)
• transfer_bonus     — Temporary % bonus when moving points between two programs. Always names source + destination. e.g. "Chase UR → Hyatt 30% bonus through May 16"
• signup_bonus       — New-card or new-program enrollment welcome offer. Includes elevated SUBs. e.g. "Amex Gold 90k MR for $4k in 6mo"
• referral_bonus     — Points earned for referring new cardholders/members.
• retention_offer    — Offer given to EXISTING account holder to keep them (renewal bonus, save-me offer).
• limited_time_offer — Time-boxed promo not covered by a more specific type above. Catch-all for deadline-driven offers that aren't transfer/signup/referral/retention.
• status_promo       — Status match, fast-track, challenge, or temporary earn-toward-status promo.

AVAILABILITY (reader action: book it)
• award_availability — Specific flights/hotels newly openable as awards at normal rates. About INVENTORY, not price. e.g. "Cathay F LAX-HKG open for April dates"
• sweet_spot         — Evergreen redemption analysis. Persistent good-value award. EDUCATIONAL, not time-sensitive.
• glitch             — Pricing ERROR / mistake fare / system bug. Temporary, usually patched fast.

CHANGES (reader action: adjust strategy)
• devaluation        — Program makes points worth LESS: raised award prices, removed sweet spots, cut transfer ratios. Reader LOSES value.
• earn_rate_change   — Base or bonus earn multipliers change on a card/program. e.g. "Citi Premier drops from 3x to 2x dining"
• category_change    — Rotating/quarterly bonus categories added, removed, or changed. e.g. "Chase Freedom Q3 5% categories announced"
• partner_change     — RELATIONSHIP between programs changes: alliance join/leave, transfer partner added/dropped, new co-brand, new booking channel. e.g. "Hawaiian joins oneworld"
• program_change     — STRUCTURAL shift to a single program not captured by devaluation/earn/category/partner: rebrand, merger, replacement, major refresh. e.g. "HawaiianMiles replaced by Atmos Rewards"
• status_change      — Qualification rules or benefits for STATUS tiers change (not a promo). e.g. "Delta raises MQD requirement"
• policy_change      — Rules governing the program change: booking rules, cancellation, expiration, fuel surcharges, terms. NOT pricing, NOT partners, NOT earn rates.

CONTEXT (reader action: stay informed)
• industry_news      — Broader travel-industry news with no direct loyalty action. e.g. regulatory ruling, airline merger announcement, bankruptcy.

TIE-BREAKERS (when multiple fit):
1. If a more specific type applies, prefer it over catch-alls (limited_time_offer, program_change, industry_news).
2. partner_change vs program_change: is the change ABOUT a relationship between programs (partner_change) or INSIDE one program (program_change)?
3. devaluation vs program_change: if points are worth LESS → devaluation. If neutral/unclear → program_change.
4. signup_bonus vs limited_time_offer: enrollment incentive ALWAYS wins even with a deadline.
5. transfer_bonus vs limited_time_offer: any % bonus on transfers ALWAYS transfer_bonus.
6. glitch vs limited_time_offer: intentional promo = limited_time_offer. Error / mistake fare = glitch.
7. industry_news is the last resort — use only when no program-specific action is available.
8. sweet_spot is for evergreen analysis. If the news is "this specific award is open right now" use award_availability.
${knownSection}
Respond with ONLY a valid JSON array of findings. No prose, no markdown, just the array.

Schema per finding:
{
  "headline": "string (clear, specific, action-oriented)",
  "description": "string (2–3 sentences: what it is, why it matters, what to do — written for a travel rewards enthusiast)",
  "source_name": "string",
  "source_type": "official|blog|reddit|social",
  "source_url": "string|null",
  "raw_text": "string (1–2 sentence excerpt from source)",
  "confidence": "high|medium|low",
  "alert_type": "string|null",
  "programs": ["slug1", "slug2"],
  "start_date": "ISO date string|null (when the promo/offer begins, if mentioned)",
  "expires_at": "ISO date string|null (when it ends or expires, if mentioned)"
}

SOURCE CONTENT:
${sourceSummaries}`,
      },
    ],
  })
  await logUsage(message, 'runScout')

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
  console.log('[runScout] Claude raw response (first 500):', raw.slice(0, 500))

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    const findings = JSON.parse(cleaned)
    return Array.isArray(findings) ? findings : []
  } catch {
    console.error('[runScout] Failed to parse Claude response:', cleaned.slice(0, 300))
    return []
  }
}
