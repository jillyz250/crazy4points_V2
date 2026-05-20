/**
 * Haiku classification of a forwarded email into an intel candidate.
 *
 * Inputs:
 *   - Subject
 *   - Sanitized body text (plain text or sanitized HTML — pre-stripped)
 *   - Sender email + domain
 *   - List of program slugs (from DB, so Haiku doesn't invent slugs)
 *
 * Output: classification shape that maps directly into IngestItemInput.
 *
 * Fail-open: on any parse/API failure, return a low-confidence "needs review"
 * shape so the email still surfaces in Triage rather than silently dying.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'

export interface EmailClassificationInput {
  subject: string
  body_text: string // plain text or stripped HTML; max 6000 chars passed to Haiku
  sender_email: string
  sender_domain: string
  /** Program slugs from DB. Haiku must pick from this list. */
  available_program_slugs: string[]
}

export type FactOriginGuess =
  | 'official'
  | 'secondary'
  | 'social-rumor'
  | 'inferred'
  | 'ai-discovered-only'

export interface EmailClassification {
  headline: string
  raw_summary: string
  programs: string[]
  alert_type: string | null
  confidence: 'high' | 'medium' | 'low'
  fact_origin: FactOriginGuess
  expires_at: string | null // ISO datetime if Haiku detected one
  has_loyalty_angle: boolean // false → caller should quarantine or discard
  /** True when we couldn't get a real Haiku response. Caller decides what to do. */
  fail_open: boolean
}

const SYSTEM_PROMPT = `You are an intake classifier for crazy4points.com — a loyalty points & miles alert site.

You receive a forwarded email. Your job: produce a structured intel candidate the editor can review in Triage.

RULES:
- "has_loyalty_angle" = true ONLY if the email is about airline / hotel / credit-card loyalty program news: transfer bonuses, promo offers, devaluations, award sales, status promos, partner changes, new co-brands, signup bonuses. Set false for unrelated commercial email (regular shopping deals, generic newsletters, account notifications).
- programs array: pick slugs ONLY from the PROGRAM LIST below. If unsure, omit. Empty array allowed.
- alert_type: pick exactly ONE from this list, or null if none clearly fits:
    transfer_bonus | signup_bonus | referral_bonus | retention_offer | limited_time_offer |
    status_promo | award_availability | sweet_spot | glitch | devaluation | earn_rate_change |
    category_change | partner_change | program_change | status_change | policy_change |
    industry_news | shopping_portal_bonus | award_sale | companion_pass | dining_bonus |
    fee_change | card_refresh | milestone_bonus | card_credit
- confidence: "high" = official issuer announcement; "medium" = credible reporting (TPG, OMAAT, FrequentMiler, etc.); "low" = forwarded promotional blast with no clear new info, or speculation.
- headline: under 100 chars, concrete and specific. Lead with the key fact.
- raw_summary: 2-4 sentences, plain English. Captures the actionable detail.
- expires_at: ISO date (YYYY-MM-DD) if the email mentions an offer deadline. Null otherwise.
- fact_origin: where the underlying CLAIM originated. Distinct from confidence — it's about the upstream source of the fact, not how credible the reporter is.
    "official"           — Direct from the issuer (forwarded From: an @<airline|hotel|bank>.com address, even if forwarded via Gmail; press release; official policy page).
    "secondary"          — Credible blog / third-party reporting (TPG, OMAAT, Frequent Miler, Prince of Travel, etc.).
    "social-rumor"       — Reddit / X social claim, not yet corroborated by official or secondary.
    "inferred"           — Analyst inference from indirect signals (Grok summary, market commentary).
    "ai-discovered-only" — AI surfaced this without a human-verifiable upstream source.
  When the email is a Gmail FORWARD, look for forwarded headers in the body (e.g. "---------- Forwarded message ----------" with a "From: ..." line). The original From address determines fact_origin, not the gmail forwarder.

OUTPUT — return ONLY strict JSON, no prose, no markdown, no code fences. All fields required:

{
  "has_loyalty_angle": boolean,
  "headline": string,
  "raw_summary": string,
  "programs": string[],
  "alert_type": string | null,
  "confidence": "high" | "medium" | "low",
  "fact_origin": "official" | "secondary" | "social-rumor" | "inferred" | "ai-discovered-only",
  "expires_at": string | null
}`

export async function classifyEmail(input: EmailClassificationInput): Promise<EmailClassification> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return failOpen('ANTHROPIC_API_KEY missing', input.subject)
  }

  const programList = input.available_program_slugs.length > 0
    ? input.available_program_slugs.join(', ')
    : '(no programs registered — leave programs empty)'

  const userMessage = `SENDER:
${input.sender_email} (${input.sender_domain})

SUBJECT:
${input.subject}

BODY (first 6000 chars):
${input.body_text.slice(0, 6000)}

PROGRAM LIST (use these slugs ONLY):
${programList}

Return strict JSON.`

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    try {
      await logUsage(response, 'classify_email_inbound', {
        sender_domain: input.sender_domain,
      })
    } catch {
      /* non-fatal */
    }

    const content = response.content[0]
    if (content.type !== 'text') return failOpen('non-text response', input.subject)

    const raw = content.text.trim()
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return failOpen('non-JSON response: ' + raw.slice(0, 120), input.subject)
    }

    if (!isClassificationShape(parsed)) {
      return failOpen('malformed shape: ' + raw.slice(0, 120), input.subject)
    }

    // Filter programs to those Haiku was told about — defense against hallucinated slugs.
    const allowed = new Set(input.available_program_slugs)
    const programs = (parsed.programs ?? []).filter((p) => allowed.has(p))

    const VALID_FACT_ORIGINS = ['official', 'secondary', 'social-rumor', 'inferred', 'ai-discovered-only'] as const
    const factOrigin: FactOriginGuess = VALID_FACT_ORIGINS.includes(parsed.fact_origin as FactOriginGuess)
      ? (parsed.fact_origin as FactOriginGuess)
      : 'secondary'
    return {
      has_loyalty_angle: parsed.has_loyalty_angle,
      headline: parsed.headline.slice(0, 240),
      raw_summary: parsed.raw_summary.slice(0, 2000),
      programs,
      alert_type: parsed.alert_type,
      confidence: parsed.confidence,
      fact_origin: factOrigin,
      expires_at: parsed.expires_at,
      fail_open: false,
    }
  } catch (err) {
    return failOpen(err instanceof Error ? err.message : String(err), input.subject)
  }
}

function failOpen(reason: string, subject: string): EmailClassification {
  console.error(`[classifyEmail] fail_open: ${reason.slice(0, 200)} (subject: ${subject.slice(0, 80)})`)
  return {
    has_loyalty_angle: true, // err on the side of surfacing
    headline: subject.slice(0, 240) || '(no subject)',
    raw_summary: `Email classification failed (${reason.slice(0, 80)}) — please review manually.`,
    programs: [],
    alert_type: null,
    confidence: 'low',
    fact_origin: 'secondary',
    expires_at: null,
    fail_open: true,
  }
}

function isClassificationShape(x: unknown): x is {
  has_loyalty_angle: boolean
  headline: string
  raw_summary: string
  programs: string[] | null
  alert_type: string | null
  confidence: 'high' | 'medium' | 'low'
  expires_at: string | null
} {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.has_loyalty_angle === 'boolean' &&
    typeof r.headline === 'string' &&
    typeof r.raw_summary === 'string' &&
    (r.confidence === 'high' || r.confidence === 'medium' || r.confidence === 'low')
  )
}
