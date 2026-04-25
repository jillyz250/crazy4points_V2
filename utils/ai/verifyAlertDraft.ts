/**
 * Server-side only. Calls Claude Sonnet 4.6 to fact-check an AI-generated
 * alert draft against the source intel's raw_text. Extracts every factual
 * claim (numbers, dates, partners, procedural steps) and marks each as
 * supported / unsupported with a severity flag.
 *
 * Unsupported HIGH-severity claims surface as warnings in admin review so
 * nothing ships without a human checking hallucinations like "400+ properties"
 * that weren't in the source article.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { AlertType } from '@/utils/supabase/queries'

// ─────────────────────────────────────────────────────────────────────────────
// PROMO-TERMS COMPLETENESS — LLM-driven structural check
//
// For promo-shaped alert types (transfer_bonus | status_promo | limited_time_offer),
// the same Sonnet fact-check call also classifies whether each of 7 qualifying
// terms is "present", "acknowledged_missing", or "absent" in the draft body.
// Terms that come back "absent" become a synthetic high-severity chip with
// the shape MISSING_PROMO_TERMS: <field, field>.
//
// award_availability is intentionally OUT of scope — those alerts don't have
// promo terms to chip against, and including them would create noise.
//
// LLM-driven rather than regex because regex misclassifies on natural prose
// (e.g. "Platinum lounge" matches the status_tier pattern even when no tier
// requirement is present). The Sonnet pass already reads the body for claim
// extraction; promo-terms judgment piggybacks on that read with a tiny
// prompt addition.
// ─────────────────────────────────────────────────────────────────────────────

const PROMO_ALERT_TYPES: ReadonlySet<AlertType> = new Set<AlertType>([
  'limited_time_offer',
  'transfer_bonus',
  'status_promo',
])

export const PROMO_TERM_LABELS: Record<string, string> = {
  earning_window:             'Earning window',
  travel_window:              'Travel / stay window',
  min_spend:                  'Minimum spend',
  min_nights_or_transactions: 'Minimum nights / transactions',
  status_tier:                'Status tier requirement',
  registration:               'Registration required',
  exclusions:                 'Exclusions / carve-outs',
}
const PROMO_TERM_KEYS = Object.keys(PROMO_TERM_LABELS)

type PromoTermStatus = 'present' | 'acknowledged_missing' | 'absent'

function isPromoAlertType(t: AlertType | null | undefined): boolean {
  return !!t && PROMO_ALERT_TYPES.has(t)
}

/**
 * Compute missing terms from the LLM's promo_terms_status map. A term is
 * "missing" if it's "absent" — neither surfaced nor explicitly acknowledged
 * as not-in-source. Other statuses pass cleanly.
 */
function missingFromStatus(
  status: Partial<Record<string, PromoTermStatus>> | null | undefined
): string[] {
  if (!status) return PROMO_TERM_KEYS.slice() // null status → assume all missing
  const missing: string[] = []
  for (const key of PROMO_TERM_KEYS) {
    const v = status[key]
    if (v !== 'present' && v !== 'acknowledged_missing') missing.push(key)
  }
  return missing
}

export interface VerifyClaim {
  claim: string
  supported: boolean
  severity: 'high' | 'low'
  source_excerpt: string | null
  // Phase 3.6 — web search pass for claims where supported=false.
  // Populated by webVerifyClaims() after the first grounding pass.
  web_verdict?: 'likely_correct' | 'likely_wrong' | 'unverifiable' | null
  web_evidence?: string | null
  web_url?: string | null
  // Phase 3.7 — admin can dismiss a claim after confirming it themselves.
  acknowledged?: boolean
}

export interface VerifyResult {
  claims: VerifyClaim[]
  checked_at: string
}

const SYSTEM_PROMPT = `You are the fact-checker for crazy4points, an award travel intelligence site.
A writer agent just turned a raw intel finding into a publish-ready draft. Your job: find
anything in the draft that is not directly supported by the SOURCE_TEXT.

═══════════════════════════════════════════════════════════
WHAT COUNTS AS A CLAIM
═══════════════════════════════════════════════════════════

Extract every falsifiable factual claim from the draft's title, summary, and description:
• Numbers ("25% bonus", "400+ properties", "5,000 points")
• Dates ("April 19 through May 16, 2026", "ends April 30")
• Named partners/programs ("Leading Hotels of the World", "Chase Sapphire Preferred")
• Procedural/UI steps ("select X as transfer partner", "log into your account")
• Specific product features ("no annual fee", "lounge access")
• Geographic or property claims ("European palaces", "hotels in Tokyo")

DO NOT extract:
• Brand-voice opinions ("this is a great deal", "don't sleep on this")
• Generic award-travel truisms ("points are worth more when transferred")
• Calls to action ("transfer before May 16" — that's a restatement of the dated claim)
• Procedural/UI steps not central to the deal ("log in", "click transfer", "go to the
  rewards page") — these are almost always unverifiable via web and rarely mislead readers
• Restatements of the SAME fact in different words (extract once, not twice — if the
  draft says "25% bonus" and "a 25 percent boost", that's one claim)
• Interpretive framing ("rare", "hard to find", "limited availability") unless a specific
  number is attached
• Background context clearly labeled as such ("historically…", "usually…", "in the past…")

Prefer FEWER, higher-quality claims over exhaustive extraction. A claim is only worth
flagging if getting it wrong would actually mislead a reader or the owner.

═══════════════════════════════════════════════════════════
GROUNDING
═══════════════════════════════════════════════════════════

For each claim, decide if it is explicitly supported by SOURCE_TEXT:
• supported = true: the claim appears verbatim or as a direct paraphrase. Fill source_excerpt
  with the smallest quoted span from SOURCE_TEXT that supports it (under 200 chars).
• supported = false: the claim is not in SOURCE_TEXT, or SOURCE_TEXT contradicts it.
  source_excerpt = null.

Numbers and dates MUST match exactly to count as supported. "400+ properties" when SOURCE_TEXT
says nothing about count → supported=false. "May 16" when SOURCE_TEXT says "May 15" → supported=false.

═══════════════════════════════════════════════════════════
SEVERITY
═══════════════════════════════════════════════════════════

severity = "high" if getting this wrong would mislead a reader into a bad decision:
• Transfer ratios, bonus percentages, point amounts
• Start/end dates of promotions
• Named partner programs or credit cards (wrong partner = wasted transfer)
• Eligibility requirements ("must be a Leaders Club member")

severity = "low" for descriptive color that's wrong-but-harmless:
• "400+ properties" when actual count is 500
• "European palaces" when source doesn't specify geography

═══════════════════════════════════════════════════════════
PROMO-TERMS COMPLETENESS (only when alert_type is provided AND ∈ promo set)
═══════════════════════════════════════════════════════════

The user payload may include "alert_type". When alert_type is one of:
"limited_time_offer" · "transfer_bonus" · "status_promo"

ALSO produce a "promo_terms_status" object alongside "claims" in your output.
For each of the 7 keys below, classify the draft body (summary + description):

KEYS (and what each means):
• earning_window — book-by, register-by, or earn-by date(s) for the offer
• travel_window — when qualifying travel/stay must complete (separate from earning window)
• min_spend — dollar threshold required to trigger the bonus
• min_nights_or_transactions — minimum nights, segments, or transactions
• status_tier — SPECIFIC elite tier required (Silver, Gold, Platinum, etc.).
  Generic "elite status" alone does NOT count as a tier requirement.
• registration — does the offer require manual registration / opt-in / enrollment
• exclusions — any excluded brands, properties, fare classes, or carve-outs

For each key, return one of three values:
• "present" — the term is meaningfully surfaced in the draft body. Generic
  word matches don't count — must be a real, specific term mention. Example:
  "Silver+" or "Bonvoy Silver and above" → status_tier = present. "Platinum
  lounge access at CDG" (a perk mention, not a tier requirement) → NOT present.
• "acknowledged_missing" — the writer explicitly notes the term is unspecified
  or doesn't apply ("Travel window not specified in source", "No registration
  required", "All elite tiers eligible"). Honest gaps, not silent omissions.
• "absent" — the term applies to this kind of offer but the draft is silent on
  it. THIS is the failure case we want to surface.

When a term genuinely doesn't apply to the alert (e.g. min_nights for a
transfer bonus that has no stay component), classify as "acknowledged_missing"
rather than "absent" — the writer correctly omitted what wasn't relevant.

If alert_type is NOT in the promo set (or is missing from payload), do NOT
produce the promo_terms_status field at all.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "claims": [
    {
      "claim": "<the factual claim from the draft, under 150 chars>",
      "supported": true | false,
      "severity": "high" | "low",
      "source_excerpt": "<quoted span from SOURCE_TEXT, or null>"
    }
  ],
  "promo_terms_status": {
    "earning_window": "present" | "acknowledged_missing" | "absent",
    "travel_window": "present" | "acknowledged_missing" | "absent",
    "min_spend": "present" | "acknowledged_missing" | "absent",
    "min_nights_or_transactions": "present" | "acknowledged_missing" | "absent",
    "status_tier": "present" | "acknowledged_missing" | "absent",
    "registration": "present" | "acknowledged_missing" | "absent",
    "exclusions": "present" | "acknowledged_missing" | "absent"
  }
}

The promo_terms_status field MUST be present when alert_type is in the promo set
("limited_time_offer", "transfer_bonus", "status_promo"), and MUST be omitted
otherwise.

If the draft contains no factual claims (unlikely), return { "claims": [] }.`

function extractJson(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return trimmed
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }
  return trimmed
}

interface ParsedVerifyResponse {
  claims: VerifyClaim[]
  promoTermsStatus: Partial<Record<string, PromoTermStatus>> | null
}

function parsePromoTermsStatus(
  raw: unknown
): Partial<Record<string, PromoTermStatus>> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  const out: Partial<Record<string, PromoTermStatus>> = {}
  for (const key of PROMO_TERM_KEYS) {
    const v = obj[key]
    if (v === 'present' || v === 'acknowledged_missing' || v === 'absent') {
      out[key] = v
    }
  }
  return Object.keys(out).length > 0 ? out : null
}

function validate(parsed: unknown): ParsedVerifyResponse {
  const obj = parsed as { claims?: unknown; promo_terms_status?: unknown }
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.claims)) {
    throw new Error('Verify result missing claims array')
  }
  const claims = obj.claims
    .map((c): VerifyClaim | null => {
      const raw = c as Partial<VerifyClaim>
      if (typeof raw.claim !== 'string' || !raw.claim.trim()) return null
      return {
        claim: raw.claim.trim().slice(0, 300),
        supported: raw.supported === true,
        severity: raw.severity === 'high' ? 'high' : 'low',
        source_excerpt: typeof raw.source_excerpt === 'string' ? raw.source_excerpt.slice(0, 400) : null,
      }
    })
    .filter((c): c is VerifyClaim => c !== null)
  return {
    claims,
    promoTermsStatus: parsePromoTermsStatus(obj.promo_terms_status),
  }
}

/**
 * Builds the synthetic MISSING_PROMO_TERMS chip from the LLM's
 * promo_terms_status map. Returns null if alert_type isn't promo-shaped
 * or if every term is "present" / "acknowledged_missing".
 *
 * When alert_type IS promo-shaped but the LLM didn't return a status map
 * (rare — model error), conservatively returns null rather than chipping
 * every term as missing. Failure mode: silent. Acceptable because the
 * regular grounding claims still surface, and the chip only adds value
 * when the LLM's structured judgment is reliable.
 */
function buildMissingPromoTermsClaim(
  alertType: AlertType | null | undefined,
  promoTermsStatus: Partial<Record<string, PromoTermStatus>> | null
): VerifyClaim | null {
  if (!isPromoAlertType(alertType)) return null
  if (!promoTermsStatus) return null
  const missing = missingFromStatus(promoTermsStatus)
  if (missing.length === 0) return null
  return {
    claim: `MISSING_PROMO_TERMS: ${missing.join(', ')}`,
    supported: false,
    severity: 'high',
    source_excerpt: null,
  }
}

export async function verifyAlertDraft(args: {
  draft: { title: string; summary: string; description: string | null }
  raw_text: string | null
  source_url: string | null
  alert_type?: AlertType | null
}): Promise<VerifyResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[verifyAlertDraft] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  const sourceText = args.raw_text?.trim()
  if (!sourceText) {
    // Nothing to ground against — return a single high-severity sentinel.
    // No promo-terms chip in this branch: without source text we can't
    // distinguish "writer omitted" from "source genuinely had no terms",
    // and chipping every term would be noise.
    return {
      claims: [
        {
          claim: 'No source text available — all draft claims are unverified.',
          supported: false,
          severity: 'high',
          source_excerpt: null,
        },
      ],
      checked_at: new Date().toISOString(),
    }
  }

  const userContent = JSON.stringify(
    {
      draft: args.draft,
      source_url: args.source_url,
      source_text: sourceText,
      alert_type: args.alert_type ?? null,
    },
    null,
    2
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return null

    const parsed = JSON.parse(extractJson(block.text))
    const { claims, promoTermsStatus } = validate(parsed)
    const promoChip = buildMissingPromoTermsClaim(args.alert_type, promoTermsStatus)

    return {
      claims: promoChip ? [...claims, promoChip] : claims,
      checked_at: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[verifyAlertDraft] Sonnet call or validation failed:', err)
    return null
  }
}

export function highSeverityUnsupported(claims: VerifyClaim[]): VerifyClaim[] {
  return claims.filter((c) => !c.supported && c.severity === 'high')
}

// ═══════════════════════════════════════════════════════════
// Phase 3.6 — web search grounding for unsupported claims
// ═══════════════════════════════════════════════════════════

const WEB_VERIFY_PROMPT = `You are a travel-industry fact-checker with access to web search.
The writer agent produced a draft; a first-pass verifier found factual claims in the draft that
are NOT supported by the source article. Your job: search the web to determine whether each
unsupported claim is likely correct, likely wrong, or unverifiable.

═══════════════════════════════════════════════════════════
HOW TO JUDGE
═══════════════════════════════════════════════════════════

Use the web_search tool to find authoritative corroboration for each claim:
• OFFICIAL PROGRAM FAQ / TERMS PAGES ARE THE SOURCE OF TRUTH. Always check the
  program's own FAQ or terms page first (e.g. flyingblue.statusmatch.com/faq/,
  chase.com/ultimate-rewards terms, hilton.com/honors promotion T&Cs). Only fall
  back to blogs (LoyaltyLobby, OneMileAtATime, FrequentMiler, ThePointsGuy) when
  the official page doesn't answer the claim.
• Current program pages > archived/outdated content
• When blogs and the official FAQ disagree, the official FAQ wins.
• Multiple corroborating sources > single source
• Prefer sources dated within the last 12 months when a number or date is in question

For each claim, return a verdict:
• "likely_correct" — authoritative source(s) agree with the claim
• "likely_wrong" — authoritative source(s) contradict the claim (e.g. different number, different date)
• "unverifiable" — no clear evidence either way, or only stale/conflicting sources

ALWAYS include:
• web_evidence: a short (under 300 char) paraphrase of what you found. Quote a number or date if relevant.
• web_url: the single most authoritative URL you used. If you used multiple, pick the best one.

Do NOT be overconfident. If the claim is a UI/procedural step ("click the transfer button"),
the web rarely has good evidence — return "unverifiable" rather than guessing.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

After all searches are done, return a single JSON object. No prose, no markdown fences.

{
  "verdicts": [
    {
      "claim": "<exact claim text as given to you>",
      "web_verdict": "likely_correct" | "likely_wrong" | "unverifiable",
      "web_evidence": "<under 300 chars>",
      "web_url": "<single URL, or null>"
    }
  ]
}

Return one verdict per input claim, in the same order.`

interface WebVerdict {
  claim: string
  web_verdict: 'likely_correct' | 'likely_wrong' | 'unverifiable'
  web_evidence: string | null
  web_url: string | null
}

function findLastTextBlock(content: Anthropic.ContentBlock[]): string | null {
  for (let i = content.length - 1; i >= 0; i--) {
    const b = content[i]
    if (b.type === 'text' && b.text.trim()) return b.text
  }
  return null
}

/**
 * For each claim where supported=false, ask Sonnet (with web_search) to judge
 * whether it's likely correct, likely wrong, or unverifiable. Returns the
 * original claim array with web_verdict / web_evidence / web_url populated on
 * unsupported claims. Supported claims pass through untouched.
 *
 * IMPORTANT: We never auto-block publish on "likely_wrong." Admin UI shows
 * every verdict + snippet + URL so the human makes the final call.
 */
export async function webVerifyClaims(args: {
  claims: VerifyClaim[]
  context: { title: string; source_url: string | null }
}): Promise<VerifyClaim[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return args.claims

  const unsupported = args.claims.filter((c) => !c.supported)
  if (unsupported.length === 0) return args.claims

  const userContent = JSON.stringify(
    {
      alert_title: args.context.title,
      original_source_url: args.context.source_url,
      claims_to_verify: unsupported.map((c) => c.claim),
    },
    null,
    2
  )

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    tools: [
      { type: 'web_search_20250305', name: 'web_search', max_uses: Math.min(unsupported.length * 2, 10) },
    ],
    system: WEB_VERIFY_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  })

  const text = findLastTextBlock(response.content)
  if (!text) {
    throw new Error('webVerifyClaims: no text block in Sonnet response')
  }

  const parsed = JSON.parse(extractJson(text)) as { verdicts?: WebVerdict[] }
  if (!Array.isArray(parsed.verdicts)) {
    throw new Error('webVerifyClaims: response missing verdicts array')
  }

  const byClaim = new Map<string, WebVerdict>()
  for (const v of parsed.verdicts) {
    if (typeof v.claim === 'string') byClaim.set(v.claim.trim(), v)
  }

  // Fallback: if claim-text lookup misses (Sonnet reformatted text), match by
  // input position — verdicts are returned in the same order as claims_to_verify.
  const byIndex = new Map<number, WebVerdict>()
  parsed.verdicts.forEach((v, i) => byIndex.set(i, v))

  let unsupportedIdx = 0
  return args.claims.map((c) => {
    if (c.supported) return c
    const v = byClaim.get(c.claim.trim()) ?? byIndex.get(unsupportedIdx++)
    if (!v) {
      return { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
    }
    return {
      ...c,
      web_verdict:
        v.web_verdict === 'likely_correct' || v.web_verdict === 'likely_wrong'
          ? v.web_verdict
          : 'unverifiable',
      web_evidence: typeof v.web_evidence === 'string' ? v.web_evidence.slice(0, 400) : null,
      web_url: typeof v.web_url === 'string' && /^https?:\/\//.test(v.web_url) ? v.web_url : null,
    }
  })
}
