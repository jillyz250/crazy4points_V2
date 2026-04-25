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
// PROMO-TERMS COMPLETENESS — structural check (no source comparison)
//
// For promo-shaped alert types, scan the body for evidence each qualifying
// term was surfaced. If a term is missing AND not explicitly acknowledged
// as "not specified in source," emit a synthetic high-severity chip.
// Deterministic regex-based check — no extra LLM cost.
// ─────────────────────────────────────────────────────────────────────────────

const PROMO_ALERT_TYPES: ReadonlySet<AlertType> = new Set<AlertType>([
  'limited_time_offer',
  'transfer_bonus',
  'status_promo',
  'award_availability',
])

interface PromoTerm {
  key: string                 // machine name reported in the chip
  patterns: RegExp[]          // any match → term considered surfaced
  acknowledgePatterns: RegExp[] // writer's explicit "not specified" form for this term
}

const PROMO_TERMS: PromoTerm[] = [
  {
    key: 'earning_window',
    patterns: [
      /book(?:ed)? by /i,
      /register(?:ation)? by /i,
      /earn by /i,
      /\bends?\b [a-z]+ \d/i,
      /through [a-z]+ \d/i,
      /\bbetween\b [a-z]+ \d{1,2}.*\band\b [a-z]+ \d{1,2}/i,
      /book\s*(?:between)?\s*[a-z]+\s*\d{1,2}\s*(?:and|–|-|to)\s*[a-z]+\s*\d{1,2}/i,
      /book(?:ing)? window/i,
      /register before/i,
      /earn(?:ing)? window/i,
    ],
    acknowledgePatterns: [/(book|earn|register).{0,40}(window|deadline).{0,40}not (specified|listed|given)/i, /no\s+(book|earn|register).{0,20}(window|deadline)\s+(specified|listed|given|mentioned)/i],
  },
  {
    key: 'travel_window',
    patterns: [
      /travel by /i,
      /complete (?:travel|the trip)/i,
      /stay completion/i,
      /stay by [a-z]+ \d/i,
      /fly by /i,
      /until [a-z]+ \d{1,2},?\s*\d{4}/i,
      /through [a-z]+ \d{1,2},?\s*\d{4}/i,
      /travel\s+window/i,
      /stay\s+through/i,
      /by january \d/i,
    ],
    acknowledgePatterns: [/travel\s+window\s+(was\s+)?not\s+(specified|listed|given|mentioned)/i, /no\s+(travel|stay).{0,20}(window|deadline)\s+(specified|listed|given|mentioned)/i],
  },
  {
    key: 'min_spend',
    patterns: [
      /\$[\d,]+\+?\s*(minimum|min|or more|in spend|spend)/i,
      /minimum\s+(of\s+)?\$[\d,]+/i,
      /spend at least \$[\d,]+/i,
      /\$[\d,]+\s*minimum spend/i,
    ],
    acknowledgePatterns: [/(minimum\s+spend|spend\s+threshold)\s+(was\s+)?not\s+(specified|listed|given|mentioned)/i, /no\s+(minimum\s+spend|spend\s+threshold)\s+(specified|listed|given|mentioned)/i],
  },
  {
    key: 'min_nights_or_transactions',
    patterns: [
      /\d+[\-\s]?night minimum/i,
      /minimum.{0,15}\d+\s*night/i,
      /\d+\s*qualifying night/i,
      /\d+\s*consecutive night/i,
      /\d+\s*segment/i,
      /\d+\s*transaction/i,
      /two[\-\s]?night/i,
      /three[\-\s]?night/i,
      /\bstay\s+at\s+least\s+\d/i,
    ],
    acknowledgePatterns: [/(minimum\s+(nights?|stays?|transactions?))\s+(was\s+)?not\s+(specified|listed|given|mentioned)/i, /no\s+minimum\s+(night|stay|transaction)/i],
  },
  {
    key: 'status_tier',
    patterns: [
      /\b(silver|gold|platinum|titanium|ambassador|diamond|emerald|onyx|sapphire|ruby)\b\+?/i,
      /\b(executive|premier|elite plus|elite\+|chairman)\b/i,
      /\bbonvoy\s+(silver|gold|platinum|titanium|ambassador)/i,
      /tier(?:\s+requirement)?:/i,
      /\bany\s+elite\s+tier\b/i,
      /\ball\s+elites?\b/i,
    ],
    acknowledgePatterns: [/no\s+status\s+tier\s+listed/i, /tier\s+(was\s+)?not\s+(specified|listed|given|mentioned)/i, /likely\s+all\s+elites/i],
  },
  {
    key: 'registration',
    patterns: [
      /register(?:ing|ed|ation)?(?:\s+(?:is\s+)?required|\s+for|\s+at|\s+via)/i,
      /opt[\s\-]in/i,
      /enroll(?:ment)?/i,
      /sign\s+up\s+(?:to|at|here|via)/i,
      /no\s+registration/i,
      /automatic(?:ally)?\s+(?:enrolled|registered|qualifies?)/i,
    ],
    acknowledgePatterns: [/registration\s+(was\s+)?not\s+(specified|listed|given|mentioned)/i, /no\s+registration\s+(specified|listed|mentioned)/i],
  },
  {
    key: 'exclusions',
    patterns: [
      /exclud(?:e|ed|es|ing)/i,
      /not\s+eligible/i,
      /doesn'?t\s+apply/i,
      /\b(except|excluding)\b/i,
      /carve[\s\-]?out/i,
      /\bcarve\b/i,
      /\bnot\s+valid\s+(?:for|on)/i,
      /no\s+exclusions/i,
      /all\s+(?:brands|properties|fares)\s+eligible/i,
    ],
    acknowledgePatterns: [/exclusions?\s+(?:were|was)?\s+not\s+(specified|listed|given|mentioned)/i, /no\s+exclusions?\s+(?:were\s+)?(specified|listed|mentioned)/i],
  },
]

/**
 * Returns the list of promo-term keys that are NEITHER surfaced in the body
 * NOR explicitly acknowledged-as-missing. Empty array means all terms covered.
 * Returns empty for non-promo alert types (and null/undefined alert_type).
 */
export function checkPromoTermsCompleteness(
  body: string,
  alertType: AlertType | null | undefined
): string[] {
  if (!alertType || !PROMO_ALERT_TYPES.has(alertType)) return []
  if (!body || !body.trim()) return PROMO_TERMS.map((t) => t.key)
  const missing: string[] = []
  for (const term of PROMO_TERMS) {
    const surfaced = term.patterns.some((p) => p.test(body))
    if (surfaced) continue
    const acknowledged = term.acknowledgePatterns.some((p) => p.test(body))
    if (acknowledged) continue
    missing.push(term.key)
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
  ]
}

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

function validate(parsed: unknown): VerifyClaim[] {
  const obj = parsed as { claims?: unknown }
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.claims)) {
    throw new Error('Verify result missing claims array')
  }
  return obj.claims
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
}

/**
 * Builds the body text the structural promo-terms check scans against.
 * Concatenates summary + description (title is rarely where terms live).
 */
function buildBodyForPromoCheck(draft: {
  summary: string
  description: string | null
}): string {
  return `${draft.summary}\n\n${draft.description ?? ''}`
}

/**
 * Returns a synthetic VerifyClaim listing missing promo terms, or null if
 * none are missing (or alert_type isn't promo-shaped). The claim text uses
 * the MISSING_PROMO_TERMS: <comma-list> shape so the admin UI can detect
 * it specifically.
 */
function buildMissingPromoTermsClaim(
  draft: { summary: string; description: string | null },
  alertType: AlertType | null | undefined
): VerifyClaim | null {
  const body = buildBodyForPromoCheck(draft)
  const missing = checkPromoTermsCompleteness(body, alertType)
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

  const promoChip = buildMissingPromoTermsClaim(args.draft, args.alert_type)

  const sourceText = args.raw_text?.trim()
  if (!sourceText) {
    // Nothing to ground against — return a single low-severity sentinel so the
    // admin UI can show "no source text to verify" instead of silent pass.
    const baseClaims: VerifyClaim[] = [
      {
        claim: 'No source text available — all draft claims are unverified.',
        supported: false,
        severity: 'high',
        source_excerpt: null,
      },
    ]
    return {
      claims: promoChip ? [...baseClaims, promoChip] : baseClaims,
      checked_at: new Date().toISOString(),
    }
  }

  const userContent = JSON.stringify(
    {
      draft: args.draft,
      source_url: args.source_url,
      source_text: sourceText,
    },
    null,
    2
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return null

    const parsed = JSON.parse(extractJson(block.text))
    const claims = validate(parsed)

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
