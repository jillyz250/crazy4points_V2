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
import { logUsage } from './logUsage'
import { BRAND_VOICE } from './editorialRules'
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

// Standard promo-shaped types share the same 7-term checklist.
const STANDARD_PROMO_TYPES: ReadonlySet<AlertType> = new Set<AlertType>([
  'limited_time_offer',
  'transfer_bonus',
  'status_promo',
  'award_availability',
])

// point_purchase (buy-miles bonuses) has a DIFFERENT term checklist.
// Sale shape, annual caps, payment routing, CPM math, historical context.
const BUY_MILES_TYPES: ReadonlySet<AlertType> = new Set<AlertType>([
  'point_purchase',
])

const PROMO_ALERT_TYPES: ReadonlySet<AlertType> = new Set<AlertType>([
  ...STANDARD_PROMO_TYPES,
  ...BUY_MILES_TYPES,
])

export const STANDARD_PROMO_TERM_LABELS: Record<string, string> = {
  earning_window:             'Earning window',
  travel_window:              'Travel / stay window',
  min_spend:                  'Minimum spend',
  min_nights_or_transactions: 'Minimum nights / transactions',
  status_tier:                'Status tier requirement',
  registration:               'Registration required',
  exclusions:                 'Exclusions / carve-outs',
}

export const BUY_MILES_TERM_LABELS: Record<string, string> = {
  bonus_tier_structure: 'Bonus tier structure',
  min_purchase:         'Minimum purchase',
  annual_cap:           'Annual cap',
  sub_period_cap:       '90-day / sub-period cap',
  purchase_window:      'Purchase window',
  posting_timeline:     'Posting timeline',
  targeted_vs_public:   'Targeted vs public',
  cpm_math:             'CPM (pre-tax / all-in)',
  refundability:        'Refundability',
  historical_context:   'Historical context',
  payment_routing:      'Payment routing',
}

// Back-compat alias for any existing imports.
export const PROMO_TERM_LABELS: Record<string, string> = {
  ...STANDARD_PROMO_TERM_LABELS,
  ...BUY_MILES_TERM_LABELS,
}

const STANDARD_PROMO_TERM_KEYS = Object.keys(STANDARD_PROMO_TERM_LABELS)
const BUY_MILES_TERM_KEYS = Object.keys(BUY_MILES_TERM_LABELS)

type PromoTermStatus = 'present' | 'acknowledged_missing' | 'absent'

function isPromoAlertType(t: AlertType | null | undefined): boolean {
  return !!t && PROMO_ALERT_TYPES.has(t)
}

function termKeysFor(t: AlertType | null | undefined): string[] {
  if (!t) return []
  if (BUY_MILES_TYPES.has(t)) return BUY_MILES_TERM_KEYS
  if (STANDARD_PROMO_TYPES.has(t)) return STANDARD_PROMO_TERM_KEYS
  return []
}

/**
 * Compute missing terms from the LLM's promo_terms_status map. A term is
 * "missing" if it's "absent" — neither surfaced nor explicitly acknowledged
 * as not-in-source. Other statuses pass cleanly.
 */
function missingFromStatus(
  alertType: AlertType | null | undefined,
  status: Partial<Record<string, PromoTermStatus>> | null | undefined
): string[] {
  const keys = termKeysFor(alertType)
  if (keys.length === 0) return []
  if (!status) return keys.slice() // null status → assume all missing
  const missing: string[] = []
  for (const key of keys) {
    const v = status[key]
    if (v !== 'present' && v !== 'acknowledged_missing') missing.push(key)
  }
  return missing
}

// ─────────────────────────────────────────────────────────────────────────────
// MATH CHECK — buy-miles CPM sanity
//
// Programs in this map publish a flat base price per 1,000 miles plus a
// (mostly US) federal excise tax on award currency purchases. For an alert
// that claims "X cents per mile" we recompute from the stated bonus % and
// compare. Mismatches surface as a MATH_CHECK chip — not a hard block, just
// a flag for the human reviewer.
//
// Start small (programs the user explicitly listed); expand as we author
// more buy-miles alerts.
// ─────────────────────────────────────────────────────────────────────────────
interface BuyMilesProgramPricing {
  base_usd_per_1000: number  // base purchase price for 1,000 miles in USD
  excise_tax_pct: number     // federal excise tax (US) applied on top
  notes?: string
}

const BUY_MILES_PROGRAM_PRICING: Record<string, BuyMilesProgramPricing> = {
  united:        { base_usd_per_1000: 35,    excise_tax_pct: 7.5 },
  aeroplan:      { base_usd_per_1000: 30,    excise_tax_pct: 0   },
  aa_aadvantage: { base_usd_per_1000: 33.08, excise_tax_pct: 7.5 },
  avianca_lifemiles: { base_usd_per_1000: 33, excise_tax_pct: 0 },
  alaska_mileage_plan: { base_usd_per_1000: 29.55, excise_tax_pct: 7.5 },
  british_airways_avios: { base_usd_per_1000: 28.63, excise_tax_pct: 0 },
}

/** Compute expected CPM (in cents per mile) given bonus % and program pricing. */
export function expectedCpm(
  programKey: string,
  bonusPct: number,
  mode: 'pretax' | 'allin'
): number | null {
  const p = BUY_MILES_PROGRAM_PRICING[programKey]
  if (!p) return null
  const base = p.base_usd_per_1000 // $ per 1,000 base miles
  const allInBase = mode === 'allin' ? base * (1 + p.excise_tax_pct / 100) : base
  const milesPer1000Base = 1000 * (1 + bonusPct / 100)
  const dollarsPerMile = allInBase / milesPer1000Base
  return dollarsPerMile * 100 // → cents/mile
}

export interface MathCheckResult {
  claimed_cpm: number | null
  bonus_pct: number | null
  program_key: string | null
  expected_pretax_cpm: number | null
  expected_allin_cpm: number | null
  verdict: 'match' | 'pretax_only_no_disclaimer' | 'mismatch' | 'unverifiable'
  notes: string | null
}

/**
 * Three-state truth model.
 *
 * - `true`          — source EXPLICITLY confirms the claim (positive
 *                     evidence in source_excerpt).
 * - `false`         — source EXPLICITLY contradicts the claim.
 * - `'unsupported'` — source is silent / can't verify from T1. Treated as
 *                     "we don't know" rather than "it's wrong." Editor
 *                     decides during review (the claim might be legit new
 *                     info our pages don't have yet — that's the amber
 *                     data-gap signal).
 *
 * Old `boolean` shape stays valid for backwards compatibility with any
 * fact_check_claims rows persisted before this change.
 */
export type ClaimSupportState = boolean | 'unsupported'

export interface VerifyClaim {
  claim: string
  supported: ClaimSupportState
  severity: 'high' | 'low'
  source_excerpt: string | null
  // Phase 3.6 — web search pass for claims where supported is not `true`.
  // Populated by webVerifyClaims() after the first grounding pass.
  web_verdict?: 'likely_correct' | 'likely_wrong' | 'unverifiable' | null
  web_evidence?: string | null
  web_url?: string | null
  // Phase 3.7 — admin can dismiss a claim after confirming it themselves.
  acknowledged?: boolean
  /**
   * Phase 4 (per-slug grounding) — when supported=true and source_excerpt
   * came from a tagged T1 surface, this records WHICH surface contributed
   * the grounding. Used by the SourcesUsed pills to show per-slug claim
   * counts. Format:
   *   - 'program:<slug>'   for /programs/<slug>
   *   - 'card:<slug>'      for /cards/<slug>
   *   - 'alert:<id>'       for the source alert prose
   *   - 'intel:<id>'       for raw intel text
   *   - 'comparison_audit' for synthetic claims from the deterministic
   *                        comparison-audit checker (Phase 2)
   *   - 'unaudited_comparison' for regex safety net flags (Phase 2)
   *   - null when no slug could be matched (web-only or pre-Phase-4)
   */
  source_slug?: string | null
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
GROUNDING — THREE-STATE TRUTH MODEL
═══════════════════════════════════════════════════════════

Each claim must be classified into ONE of three states. Source SILENCE
is its own category — do NOT collapse silence into false.

• supported = true
  SOURCE_TEXT explicitly confirms the claim. Fill source_excerpt with
  the smallest quoted span from SOURCE_TEXT that supports it (<200 chars).

• supported = false
  SOURCE_TEXT explicitly CONTRADICTS the claim. (e.g. draft says "May 16"
  and SOURCE_TEXT says "May 15".) source_excerpt = the contradicting span.
  Use ONLY when there is positive evidence of contradiction in source.

• supported = "unsupported"
  SOURCE_TEXT is silent on the claim — neither confirms nor contradicts.
  source_excerpt = null. The downstream pipeline treats this as "we don't
  know," not "it's wrong." It might be legit info that's true but absent
  from our source data.

If you're unsure between false and "unsupported", choose "unsupported".
Reserve false for cases where the source EXPLICITLY says otherwise.

Numbers and dates MUST match exactly. "400+ properties" when source is
silent on count → supported = "unsupported" (not false).

═══════════════════════════════════════════════════════════
NEGATIVE CLAIMS — special grounding rule
═══════════════════════════════════════════════════════════

A negative claim asserts the absence of something: "X doesn't have Y",
"no X", "X is missing", "X-only".

To mark a negative claim supported=true, the source must EXPLICITLY
state the absence. Source silence is NOT proof of absence.

Examples:
  Claim: "The business card has no dining bonus."
  Source says: "Earn 2x on top 3 of 8 eligible business categories"
  (no enumeration of the 8)
  → supported = "unsupported" (silence ≠ proof of absence)

  Claim: "The card has no foreign transaction fee."
  Source says: "Foreign transaction fee: none (0%)"
  → supported = true (explicit confirmation of absence)

═══════════════════════════════════════════════════════════
COMPARATIVE / DERIVED CLAIMS — extract these as their own claims
═══════════════════════════════════════════════════════════

When the draft makes a comparison ("same rate as", "faster than", "double",
"equal to", "more than", "less than", "beats", "ahead of"), extract the
comparison itself as a separate claim, distinct from the atomic numbers.

Example draft sentence:
  "5 nights per $10K — the same rate as the personal card's 2 per $5K"

Extract THREE claims:
  1. "Business card earns 5 qualifying nights per $10K"  (atomic)
  2. "Personal card earns 2 qualifying nights per $5K"   (atomic)
  3. "Business and personal earn at the same rate per dollar"  (comparison)

For the comparison claim: if both atomic numbers are in the source, you
may verify the math directly (5/10000 = 0.0005, 2/5000 = 0.0004 → NOT
the same → supported = false). If you can't verify the math from source,
mark supported = "unsupported".

═══════════════════════════════════════════════════════════
PROGRAM_REFERENCE (authoritative property/category data, optional)
═══════════════════════════════════════════════════════════

The user payload may include "program_reference" — a list of authoritative
fact rows for properties the draft mentions, sourced from our internal DB.
Each line is roughly:
  "Park Hyatt Tokyo — Cat 7 — Tokyo, Japan — 25K/30K/35K"

When PROGRAM_REFERENCE is provided, treat it as ground truth that overrides
SOURCE_TEXT for property and category claims. Specifically:

• If a draft claim about a named property contradicts PROGRAM_REFERENCE
  (wrong category, wrong location, wrong points, wrong all-inclusive flag),
  mark the claim supported=false, severity="high", source_excerpt=null.
• If a draft claim about a named property is consistent with PROGRAM_REFERENCE,
  it is supported even if SOURCE_TEXT doesn't explicitly mention it. Use the
  matching reference line as source_excerpt (prefix it with "REF: ").
• PROGRAM_REFERENCE is not exhaustive — only properties the draft mentions
  appear there. Properties NOT in the reference fall back to SOURCE_TEXT
  grounding as usual.

When PROGRAM_REFERENCE is absent or empty, ignore this section.

═══════════════════════════════════════════════════════════
ALLIANCE_CONTEXT (alliance-wide claims, optional)
═══════════════════════════════════════════════════════════

The user payload may include "alliance_context" — pre-formatted content from
the relevant oneworld / SkyTeam / Star Alliance program page (intro, sweet
spots, lounge ruleset, tier crossover, member airlines, quirks). Use it to
validate alliance-wide claims the draft makes:

• Tier crossover (e.g., "Atmos Gold = oneworld Sapphire") — verify against
  the alliance's member_programs / tier_crossover entries.
• Lounge ruleset (e.g., "intra-North America AAdvantage members no oneworld
  lounge access") — verify against the alliance lounge_access block.
• RTW awards / Circle Pacific products — verify against alliance quirks.
• Member airlines list — verify a claim that "Carrier X is in alliance Y."

Defer to the carrier's own program data (PROGRAM_REFERENCE or SOURCE_TEXT)
when the carrier and alliance disagree. Alliance context is supplementary
for alliance-wide facts; carrier-specific facts (tier qualification, lounge
pricing, fleet) live on the carrier's own page.

When alliance_context is absent, ignore this section.

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

The user payload may include "alert_type". The keys you classify depend on it.

GROUP A — STANDARD PROMO TYPES
"limited_time_offer" · "transfer_bonus" · "status_promo" · "award_availability"

Classify each of these 7 keys:
• earning_window — book-by, register-by, or earn-by date(s) for the offer
• travel_window — when qualifying travel/stay must complete (separate from earning window)
• min_spend — dollar threshold required to trigger the bonus
• min_nights_or_transactions — minimum nights, segments, or transactions
• status_tier — SPECIFIC elite tier required (Silver, Gold, Platinum, etc.).
  Generic "elite status" alone does NOT count as a tier requirement.
• registration — does the offer require manual registration / opt-in / enrollment
• exclusions — any excluded brands, properties, fare classes, or carve-outs

GROUP B — BUY-MILES TYPE
"point_purchase" (buy-points/miles bonus sales)

Classify each of these 11 keys instead:
• bonus_tier_structure — flat % vs tiered (e.g. "40% at 5K but 80% only at 50K+")
• min_purchase — minimum base miles/points required to trigger the offer
• annual_cap — calendar-year cap on purchased miles (e.g. United 200K)
• sub_period_cap — rolling 90-day or monthly cap, if any
• purchase_window — sale start/end date
• posting_timeline — instant vs delayed (48–72hr) crediting
• targeted_vs_public — flag whether the bonus varies by account / login required
• cpm_math — explicit "pre-tax" or "all-in" label on any CPM number quoted.
  A bare "1.94¢/mi" with no pre-tax/all-in label is NOT present.
• refundability — note that purchases are typically non-refundable
• historical_context — last sale's bonus %, best-ever bonus %, or similar
  context that helps the reader decide whether to buy now or wait
• payment_routing — whether the charge codes as travel or as a third-party
  processor (e.g. Points.com), since this affects card category bonuses

For each key in the active group, return one of three values:
• "present" — the term is meaningfully surfaced in the draft body. Generic
  word matches don't count — must be a real, specific term mention.
• "acknowledged_missing" — the writer explicitly notes the term is unspecified
  or doesn't apply ("Annual cap not specified in source", "All accounts targeted").
  Honest gaps, not silent omissions.
• "absent" — the term applies to this kind of offer but the draft is silent on
  it. THIS is the failure case we want to surface.

When a term genuinely doesn't apply to the alert (e.g. min_nights for a
transfer bonus that has no stay component), classify as "acknowledged_missing"
rather than "absent".

If alert_type is NOT in either promo group (or is missing from payload), do NOT
produce the promo_terms_status field at all.

═══════════════════════════════════════════════════════════
BRAND VOICE SCORE (every alert, regardless of type)
═══════════════════════════════════════════════════════════

Score the draft 1–5 against the crazy4points BRAND_VOICE rubric included
in the user payload (under "brand_voice_rubric"). Brand voice is sassy +
funny like a well-traveled friend — never obnoxious, never mean.

Common failure modes that drag the score below 4:
• Flat marketing copy ("a great way to earn points")
• Repeated urgency phrases ("pull the trigger" + "buy before X" + "don't sleep")
• Missing the "why care" hook in sentence 1 of the summary
• No specific use-case anchor (a real redemption the reader can picture)
• Press-release verbs ("expanded eligibility", "rolls out", "is pleased to")
• Over-explaining ("meaning [X]", "which is to say")

Scoring guide:
• 5 — sounds like the brand on a great day
• 4 — clean and on-brand, no obvious failures
• 3 — passable but flat or generic in places
• 2 — clear voice failures (multiple flat sections, or one bad pattern repeated)
• 1 — off-brand entirely (corporate, mean, clickbait, or all of the above)

Return:
• brand_voice_score: integer 1–5
• brand_voice_notes: 1–2 short sentences explaining the score, naming the
  specific failure mode if score ≤3.

═══════════════════════════════════════════════════════════
MATH CHECK (only for point_purchase and transfer_bonus)
═══════════════════════════════════════════════════════════

If alert_type is "point_purchase" or "transfer_bonus", scan the draft for any
"X cents per mile/point" or "X¢/mi" claim (CPM = cost per mile).

When you find one, return:
• cpm_extraction.claimed_cpm_cents — the number the draft quotes (e.g. 1.94)
• cpm_extraction.bonus_pct — the bonus % the draft quotes (e.g. 80)
• cpm_extraction.is_pretax_labeled — true if the draft explicitly says "pre-tax"
  near the CPM, false otherwise
• cpm_extraction.is_allin_labeled — true if the draft explicitly says "all-in"
  or "after tax" near the CPM, false otherwise
• cpm_extraction.program_key — best guess from this set or null if no match:
    "united", "aeroplan", "aa_aadvantage", "avianca_lifemiles",
    "alaska_mileage_plan", "british_airways_avios"

If no CPM number is quoted, return cpm_extraction = null.

Do NOT compute pre-tax/all-in math yourself — the verifier code does that.
You only extract what the draft says.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "claims": [
    {
      "claim": "<the factual claim from the draft, under 150 chars>",
      "supported": true | false | "unsupported",
      "severity": "high" | "low",
      "source_excerpt": "<quoted span from SOURCE_TEXT, or null>"
    }
  ],
  "promo_terms_status": {
    // 7 keys for Group A, OR 11 keys for Group B — match the alert_type group
    "<key>": "present" | "acknowledged_missing" | "absent"
  },
  "brand_voice_score": 1 | 2 | 3 | 4 | 5,
  "brand_voice_notes": "<1-2 sentences>",
  "cpm_extraction": {
    "claimed_cpm_cents": <number>,
    "bonus_pct": <number>,
    "is_pretax_labeled": <bool>,
    "is_allin_labeled": <bool>,
    "program_key": "<key or null>"
  } | null
}

The promo_terms_status field is required only when alert_type is in either
promo group; omit otherwise.
The cpm_extraction field is required only for point_purchase / transfer_bonus
draft inputs; for other types omit it or set null.
brand_voice_score is required for ALL alerts.

If the draft contains no factual claims (unlikely), return { "claims": [] } and
still include brand_voice_score.`

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

/**
 * Tries hard to parse JSON; if Sonnet's output got truncated mid-array
 * (hits max_tokens), recovers by trimming back to the last complete claim
 * object and closing the JSON. Better than throwing and losing every claim
 * we DID extract. See verifyArticleBody.ts for the same heuristic.
 */
function parseJsonResilient(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw)
  } catch (err) {
    const claimsIdx = raw.indexOf('"claims"')
    if (claimsIdx < 0) throw err
    const arrayStart = raw.indexOf('[', claimsIdx)
    if (arrayStart < 0) throw err
    let depth = 0
    let inString = false
    let escape = false
    let lastCleanEnd = -1
    for (let i = arrayStart; i < raw.length; i++) {
      const ch = raw[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) lastCleanEnd = i
      }
    }
    if (lastCleanEnd < 0) throw err
    const repaired = raw.slice(0, lastCleanEnd + 1) + ']}'
    console.warn(
      `[${label}] JSON truncated at position ${raw.length}; recovered ${
        repaired.split('"claim"').length - 1
      } claims via repair.`
    )
    return JSON.parse(repaired)
  }
}

interface CpmExtraction {
  claimed_cpm_cents: number | null
  bonus_pct: number | null
  is_pretax_labeled: boolean
  is_allin_labeled: boolean
  program_key: string | null
}

interface ParsedVerifyResponse {
  claims: VerifyClaim[]
  promoTermsStatus: Partial<Record<string, PromoTermStatus>> | null
  brandVoiceScore: number | null
  brandVoiceNotes: string | null
  cpmExtraction: CpmExtraction | null
}

function parsePromoTermsStatus(
  alertType: AlertType | null | undefined,
  raw: unknown
): Partial<Record<string, PromoTermStatus>> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const keys = termKeysFor(alertType)
  if (keys.length === 0) return null
  const obj = raw as Record<string, unknown>
  const out: Partial<Record<string, PromoTermStatus>> = {}
  for (const key of keys) {
    const v = obj[key]
    if (v === 'present' || v === 'acknowledged_missing' || v === 'absent') {
      out[key] = v
    }
  }
  return Object.keys(out).length > 0 ? out : null
}

function parseCpmExtraction(raw: unknown): CpmExtraction | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  const claimed = typeof obj.claimed_cpm_cents === 'number' ? obj.claimed_cpm_cents : null
  const bonus = typeof obj.bonus_pct === 'number' ? obj.bonus_pct : null
  if (claimed === null && bonus === null) return null
  return {
    claimed_cpm_cents: claimed,
    bonus_pct: bonus,
    is_pretax_labeled: obj.is_pretax_labeled === true,
    is_allin_labeled: obj.is_allin_labeled === true,
    program_key: typeof obj.program_key === 'string' ? obj.program_key : null,
  }
}

function validate(parsed: unknown, alertType: AlertType | null | undefined): ParsedVerifyResponse {
  const obj = parsed as {
    claims?: unknown
    promo_terms_status?: unknown
    brand_voice_score?: unknown
    brand_voice_notes?: unknown
    cpm_extraction?: unknown
  }
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.claims)) {
    throw new Error('Verify result missing claims array')
  }
  const claims = obj.claims
    .map((c): VerifyClaim | null => {
      const raw = c as Partial<VerifyClaim>
      if (typeof raw.claim !== 'string' || !raw.claim.trim()) return null
      // Three-state truth: preserve `'unsupported'` distinct from `false`.
      // Anything that isn't strictly `true` / `false` / `'unsupported'`
      // (defensive — malformed or legacy boolean-only payload) defaults
      // to `'unsupported'` so we don't accidentally mark something
      // contradicted that the model didn't actually contradict.
      const supportedRaw = raw.supported
      const supported: ClaimSupportState =
        supportedRaw === true
          ? true
          : supportedRaw === false
          ? false
          : supportedRaw === 'unsupported'
          ? 'unsupported'
          : 'unsupported'
      return {
        claim: raw.claim.trim().slice(0, 300),
        supported,
        severity: raw.severity === 'high' ? 'high' : 'low',
        source_excerpt: typeof raw.source_excerpt === 'string' ? raw.source_excerpt.slice(0, 400) : null,
      }
    })
    .filter((c): c is VerifyClaim => c !== null)

  let brandVoiceScore: number | null = null
  if (typeof obj.brand_voice_score === 'number' && obj.brand_voice_score >= 1 && obj.brand_voice_score <= 5) {
    brandVoiceScore = Math.round(obj.brand_voice_score)
  }

  return {
    claims,
    promoTermsStatus: parsePromoTermsStatus(alertType, obj.promo_terms_status),
    brandVoiceScore,
    brandVoiceNotes: typeof obj.brand_voice_notes === 'string' ? obj.brand_voice_notes.trim().slice(0, 300) : null,
    cpmExtraction: parseCpmExtraction(obj.cpm_extraction),
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
  const missing = missingFromStatus(alertType, promoTermsStatus)
  if (missing.length === 0) return null
  return {
    claim: `MISSING_PROMO_TERMS: ${missing.join(', ')}`,
    supported: false,
    severity: 'high',
    source_excerpt: null,
  }
}

/**
 * OFF_BRAND_VOICE chip — emitted when score ≤ 3. Notes from the LLM are
 * appended so the human reviewer knows which failure mode to fix.
 */
function buildBrandVoiceClaim(
  score: number | null,
  notes: string | null
): VerifyClaim | null {
  if (score === null || score > 3) return null
  const noteSuffix = notes ? ` — ${notes}` : ''
  return {
    claim: `OFF_BRAND_VOICE (${score}/5)${noteSuffix}`.slice(0, 300),
    supported: false,
    severity: score <= 2 ? 'high' : 'low',
    source_excerpt: null,
  }
}

/**
 * MATH_CHECK chip for buy-miles / transfer-bonus CPM claims. Recomputes the
 * expected CPM from the bonus % + base price + tax; emits a chip when the
 * draft's number disagrees, OR when a pre-tax-only number is quoted without
 * a "pre-tax" disclaimer (the United 1.94¢ trap).
 *
 * Returns null when:
 * • alert_type isn't point_purchase / transfer_bonus
 * • LLM didn't extract a CPM (no number in draft)
 * • program isn't in BUY_MILES_PROGRAM_PRICING (can't recompute)
 */
function buildMathCheckClaim(
  alertType: AlertType | null | undefined,
  cpm: CpmExtraction | null
): VerifyClaim | null {
  if (!cpm) return null
  if (alertType !== 'point_purchase' && alertType !== 'transfer_bonus') return null
  if (cpm.claimed_cpm_cents === null || cpm.bonus_pct === null) return null
  if (!cpm.program_key) return null

  const expectedPretax = expectedCpm(cpm.program_key, cpm.bonus_pct, 'pretax')
  const expectedAllIn = expectedCpm(cpm.program_key, cpm.bonus_pct, 'allin')
  if (expectedPretax === null || expectedAllIn === null) return null

  const claimed = cpm.claimed_cpm_cents
  const tolerance = 0.05 // ¢/mi rounding wiggle room
  const matchesPretax = Math.abs(claimed - expectedPretax) <= tolerance
  const matchesAllIn = Math.abs(claimed - expectedAllIn) <= tolerance

  // pre-tax-only number quoted without disclaimer → flag it
  if (matchesPretax && !cpm.is_pretax_labeled && expectedAllIn > expectedPretax + tolerance) {
    return {
      claim:
        `MATH_CHECK: claimed=${claimed.toFixed(2)}¢ matches pre-tax but not labeled — ` +
        `all-in is ${expectedAllIn.toFixed(2)}¢ (${cpm.program_key} @ ${cpm.bonus_pct}% bonus)`,
      supported: false,
      severity: 'high',
      source_excerpt: null,
    }
  }

  if (matchesPretax || matchesAllIn) return null

  // Genuine mismatch — neither pre-tax nor all-in matches.
  return {
    claim:
      `MATH_CHECK: claimed=${claimed.toFixed(2)}¢, expected pre-tax=${expectedPretax.toFixed(2)}¢ ` +
      `or all-in=${expectedAllIn.toFixed(2)}¢ (${cpm.program_key} @ ${cpm.bonus_pct}% bonus)`,
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
  /**
   * Authoritative property/category facts from `hotel_properties`, formatted
   * by `buildProgramReferenceForDraft`. Only present for hotel programs whose
   * draft actually mentions one of their properties. When set, Sonnet treats
   * it as ground truth that overrides SOURCE_TEXT for property-level claims.
   */
  program_reference?: string | null
  /**
   * Pre-formatted alliance context for any tagged program that belongs to
   * oneworld / SkyTeam / Star Alliance. Used to validate alliance-wide
   * claims (lounge ruleset, tier crossover, RTW products, member airlines).
   * Defer to the carrier's own page on conflicts. Built via
   * `loadAllianceContextForPrograms(supabase, programIds)`.
   */
  alliance_context?: string | null
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
      program_reference: args.program_reference ?? null,
      alliance_context: args.alliance_context ?? null,
      brand_voice_rubric: BRAND_VOICE,
    },
    null,
    2
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      // Bumped from 2400 — alerts with promo_terms_status + many claims can
      // overflow. 6000 leaves headroom; Sonnet 4.6 supports ~16K.
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(message, 'verifyAlertDraft')

    const block = message.content[0]
    if (block.type !== 'text') return null

    // Resilient parse — recovers from mid-array truncation if max_tokens hits.
    const parsed = parseJsonResilient(extractJson(block.text), 'verifyAlertDraft')
    const { claims, promoTermsStatus, brandVoiceScore, brandVoiceNotes, cpmExtraction } =
      validate(parsed, args.alert_type)

    const extras: VerifyClaim[] = []
    const promoChip = buildMissingPromoTermsClaim(args.alert_type, promoTermsStatus)
    if (promoChip) extras.push(promoChip)
    const voiceChip = buildBrandVoiceClaim(brandVoiceScore, brandVoiceNotes)
    if (voiceChip) extras.push(voiceChip)
    const mathChip = buildMathCheckClaim(args.alert_type, cpmExtraction)
    if (mathChip) extras.push(mathChip)

    return {
      claims: extras.length > 0 ? [...claims, ...extras] : claims,
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
  await logUsage(response, 'verifyAlertDraft')

  const text = findLastTextBlock(response.content)
  // Graceful degradation: if Sonnet hedged with prose ("This validation…")
  // instead of JSON, or returned nothing parseable, don't kill the regenerate
  // loop — pass through the original claims tagged "unverifiable". Caller
  // already treats unverifiable as a soft state (admin reviews manually).
  const fallback = (): VerifyClaim[] =>
    args.claims.map((c) =>
      c.supported
        ? c
        : { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
    )

  if (!text) {
    console.warn('[webVerifyClaims] no text block in Sonnet response — falling back to unverifiable')
    return fallback()
  }

  let parsed: { verdicts?: WebVerdict[] }
  try {
    parsed = JSON.parse(extractJson(text)) as { verdicts?: WebVerdict[] }
  } catch (err) {
    console.warn(
      '[webVerifyClaims] JSON parse failed — falling back to unverifiable. Sample:',
      text.slice(0, 200),
      err
    )
    return fallback()
  }
  if (!Array.isArray(parsed.verdicts)) {
    console.warn('[webVerifyClaims] response missing verdicts array — falling back to unverifiable')
    return fallback()
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
