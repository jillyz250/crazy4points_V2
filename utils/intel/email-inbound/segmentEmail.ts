/**
 * segmentEmail — split ONE forwarded email into 1..N distinct loyalty stories.
 *
 * The old classifier collapsed a whole email into a single intel candidate, so a
 * roundup (AwardWallet digest, a Daily Data Digest, a promo email with several
 * offers) became one triage card and every story past the first was lost. This
 * asks Haiku to break the email into discrete stories — each its own offer,
 * devaluation, partnership, or news item — so each fans out into its own
 * intel_item and gets triaged individually.
 *
 * A single-topic email simply returns one segment. Non-loyalty filler (featured
 * card ads, "book now" CTAs, account balances, unsubscribe) is dropped. When the
 * whole email has no loyalty angle, has_loyalty_angle=false and segments=[].
 *
 * Fail-open: on any API/parse failure, return one low-confidence segment from the
 * subject so the email still surfaces in Triage rather than silently dying.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'
import type { FactOriginGuess } from './classifyEmail'

export interface EmailSegment {
  headline: string
  raw_summary: string
  programs: string[]
  alert_type: string | null
  confidence: 'high' | 'medium' | 'low'
  fact_origin: FactOriginGuess
  expires_at: string | null
  source_url: string | null
}

export interface EmailSegmentation {
  has_loyalty_angle: boolean
  fail_open: boolean
  segments: EmailSegment[]
}

export interface SegmentEmailInput {
  subject: string
  body_text: string
  sender_email: string
  sender_domain: string
  available_program_slugs: string[]
  /** Safe URLs extracted from the email, so each story can carry its own link. */
  urls: string[]
}

const MAX_SEGMENTS = 15

const SYSTEM_PROMPT = `You are an intake classifier for crazy4points.com — a loyalty points & miles alert site.

You receive ONE forwarded email. It may contain a SINGLE story or MANY (roundups like AwardWallet digests, "Daily Data Digest", or promo emails that bundle several offers). Split it into DISTINCT loyalty stories so each can be reviewed on its own.

WHAT COUNTS AS ONE SEGMENT:
- Each distinct offer, transfer bonus, award sale, devaluation, partnership, co-brand launch, signup/retention bonus, or policy change is ONE segment.
- Do NOT split a single story's own sub-bullets, tiers, or examples into multiple segments.
- Do NOT merge two clearly different offers/programs into one segment.
- DROP non-story filler: featured-card ads, generic "book now" CTAs, account balances, points totals, unsubscribe/legal footers, and anything with no new loyalty news.

For EACH segment produce:
- headline: under 100 chars, concrete and specific, lead with the key fact.
- raw_summary: 2-4 sentences, plain English, capturing the actionable detail for THAT story only.
- programs: slugs ONLY from the PROGRAM LIST below; omit if unsure; empty array allowed.
- alert_type: exactly ONE of, or null:
    transfer_bonus | signup_bonus | referral_bonus | retention_offer | limited_time_offer |
    status_promo | award_availability | sweet_spot | glitch | devaluation | earn_rate_change |
    category_change | partner_change | program_change | status_change | policy_change |
    industry_news | shopping_portal_bonus | award_sale | companion_pass | dining_bonus |
    fee_change | card_refresh | milestone_bonus | card_credit
- confidence: "high" = official issuer announcement; "medium" = credible reporting (TPG, OMAAT, Frequent Miler...); "low" = promotional blast with no clear new info, or speculation.
- fact_origin: where the CLAIM originated (distinct from confidence):
    "official" — direct from the issuer (From an @<airline|hotel|bank>.com address, even if forwarded via Gmail; press release; official page).
    "secondary" — credible blog / third-party reporting.
    "social-rumor" — Reddit / X claim, not yet corroborated.
    "inferred" — analyst inference from indirect signals.
    "ai-discovered-only" — no human-verifiable upstream source.
  On a Gmail FORWARD, the ORIGINAL From address (in the forwarded headers) determines fact_origin, not the forwarder.
- expires_at: ISO date (YYYY-MM-DD) if THAT story mentions a deadline, else null.
- source_url: the single most relevant link for THAT story, chosen from the URL LIST below. Use null if none clearly matches. Never invent a URL.

has_loyalty_angle = false ONLY if the ENTIRE email is non-loyalty (shopping deal, generic newsletter, account notification). In that case return an empty segments array.

Return AT MOST ${MAX_SEGMENTS} segments (the most important ones if there are more).

OUTPUT — return ONLY strict JSON, no prose, no markdown, no code fences:

{
  "has_loyalty_angle": boolean,
  "segments": [
    {
      "headline": string,
      "raw_summary": string,
      "programs": string[],
      "alert_type": string | null,
      "confidence": "high" | "medium" | "low",
      "fact_origin": "official" | "secondary" | "social-rumor" | "inferred" | "ai-discovered-only",
      "expires_at": string | null,
      "source_url": string | null
    }
  ]
}`

const VALID_FACT_ORIGINS = ['official', 'secondary', 'social-rumor', 'inferred', 'ai-discovered-only'] as const

export async function segmentEmail(input: SegmentEmailInput): Promise<EmailSegmentation> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return failOpen('ANTHROPIC_API_KEY missing', input.subject)

  const programList = input.available_program_slugs.length > 0
    ? input.available_program_slugs.join(', ')
    : '(no programs registered — leave programs empty)'
  const urlList = input.urls.length > 0 ? input.urls.slice(0, 40).join('\n') : '(no links found)'

  const userMessage = `SENDER:
${input.sender_email} (${input.sender_domain})

SUBJECT:
${input.subject}

BODY:
${input.body_text}

PROGRAM LIST (use these slugs ONLY):
${programList}

URL LIST (pick source_url per story from these ONLY):
${urlList}

Return strict JSON.`

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    try {
      await logUsage(response, 'segment_email_inbound', { sender_domain: input.sender_domain })
    } catch {
      /* non-fatal */
    }

    const content = response.content[0]
    if (content.type !== 'text') return failOpen('non-text response', input.subject)
    const jsonText = content.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return failOpen('non-JSON response: ' + content.text.slice(0, 120), input.subject)
    }
    if (typeof parsed !== 'object' || parsed === null) return failOpen('malformed shape', input.subject)
    const p = parsed as Record<string, unknown>
    if (typeof p.has_loyalty_angle !== 'boolean' || !Array.isArray(p.segments)) {
      return failOpen('malformed shape', input.subject)
    }

    const allowedPrograms = new Set(input.available_program_slugs)
    const allowedUrls = new Set(input.urls)
    const segments: EmailSegment[] = []
    for (const raw of p.segments.slice(0, MAX_SEGMENTS)) {
      if (typeof raw !== 'object' || raw === null) continue
      const s = raw as Record<string, unknown>
      if (typeof s.headline !== 'string' || !s.headline.trim()) continue
      const confidence = s.confidence === 'high' || s.confidence === 'medium' || s.confidence === 'low'
        ? s.confidence
        : 'low'
      const fact_origin: FactOriginGuess = VALID_FACT_ORIGINS.includes(s.fact_origin as FactOriginGuess)
        ? (s.fact_origin as FactOriginGuess)
        : 'secondary'
      const programs = Array.isArray(s.programs)
        ? (s.programs as unknown[]).filter((x): x is string => typeof x === 'string' && allowedPrograms.has(x))
        : []
      // Only trust a source_url the model was actually given (no hallucinated links).
      const source_url = typeof s.source_url === 'string' && allowedUrls.has(s.source_url) ? s.source_url : null
      segments.push({
        headline: s.headline.slice(0, 240),
        raw_summary: typeof s.raw_summary === 'string' ? s.raw_summary.slice(0, 2000) : '',
        programs,
        alert_type: typeof s.alert_type === 'string' ? s.alert_type : null,
        confidence,
        fact_origin,
        expires_at: typeof s.expires_at === 'string' ? s.expires_at : null,
        source_url,
      })
    }

    return { has_loyalty_angle: p.has_loyalty_angle, fail_open: false, segments }
  } catch (err) {
    return failOpen(err instanceof Error ? err.message : String(err), input.subject)
  }
}

function failOpen(reason: string, subject: string): EmailSegmentation {
  console.error(`[segmentEmail] fail_open: ${reason.slice(0, 200)} (subject: ${subject.slice(0, 80)})`)
  return {
    has_loyalty_angle: true, // err on the side of surfacing
    fail_open: true,
    segments: [
      {
        headline: subject.slice(0, 240) || '(no subject)',
        raw_summary: `Email segmentation failed (${reason.slice(0, 80)}) — please review manually.`,
        programs: [],
        alert_type: null,
        confidence: 'low',
        fact_origin: 'secondary',
        expires_at: null,
        source_url: null,
      },
    ],
  }
}
