/**
 * Fact-checks a drafted article body against its source context (source alert
 * description/summary + optional raw intel text). Returns VerifyClaim[] using
 * the same shape as verifyAlertDraft, so existing admin renderers work.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { ClaimSupportState, VerifyClaim, VerifyResult } from './verifyAlertDraft'
import {
  extractComparisonAudits,
  verifyComparisonAudits,
  comparisonResultsToClaims,
  detectUnauditedComparisons,
  stripComparisonAudits,
} from './verifyComparisons'
import { findSegmentForExcerpt, type SourceSegment } from './sourceTextSegments'

export type { ClaimSupportState, VerifyClaim, VerifyResult } from './verifyAlertDraft'

const SYSTEM_PROMPT_WITH_SOURCE = `You are the fact-checker for crazy4points, an award travel intelligence site.
A writer agent just produced a publish-ready article body. Your job: extract every falsifiable
factual claim from the body and determine whether each is supported by SOURCE_TEXT.

═══════════════════════════════════════════════════════════
WHAT COUNTS AS A CLAIM
═══════════════════════════════════════════════════════════

Extract falsifiable claims:
• Numbers (bonus %, point amounts, prices, availability %)
• Dates (promo start/end, deadlines)
• Named programs, partners, properties, cards
• Specific benefits/rules ("no annual fee", "transfer ratio 1:1")
• Geographic or product claims
• NEGATIVE claims — "X doesn't have Y", "no Z", "missing W", "X-only".
  Extract these as their own items; they have a special grounding rule
  (see below).
• COMPARATIVE / DERIVED claims — "same rate as", "faster than", "double",
  "equal to", "more than", "less than". Extract the comparison itself
  as a separate claim, distinct from the atomic numbers it's built from.

Skip:
• Opinions, brand-voice flourishes, calls to action
• Generic award-travel truisms
• Duplicates — extract each distinct fact once

Prefer FEWER high-quality claims over exhaustive extraction.

═══════════════════════════════════════════════════════════
GROUNDING — THREE-STATE TRUTH MODEL
═══════════════════════════════════════════════════════════

Each claim must be classified into ONE of three states. Source SILENCE
is its own category — do NOT collapse silence into false.

• supported = true
  SOURCE_TEXT explicitly confirms. Fill source_excerpt with the smallest
  quoted span (<200 chars).

• supported = false
  SOURCE_TEXT explicitly CONTRADICTS the claim. source_excerpt = the
  contradicting span. Use ONLY when there is positive evidence of
  contradiction, not when source is silent.

• supported = "unsupported"
  SOURCE_TEXT is silent — neither confirms nor contradicts. source_excerpt
  = null. Treated downstream as "we don't know," not "it's wrong." Often
  this is legit info that's true but absent from our source data.

If you're unsure between false and "unsupported", choose "unsupported".
Reserve false for explicit contradiction.

Numbers and dates must match exactly. "400+ properties" when source is
silent on count → "unsupported" (not false).

═══════════════════════════════════════════════════════════
NEGATIVE CLAIMS — special rule
═══════════════════════════════════════════════════════════

A negative claim asserts the absence of something. To mark it supported=true,
SOURCE_TEXT must EXPLICITLY state the absence. Source silence ≠ proof.

Example:
  Claim: "The business card has no dining bonus."
  Source: "Earn 2x on top 3 of 8 eligible business categories"
          (no list of categories)
  → supported = "unsupported" (silence, not proof)

  Claim: "No foreign transaction fee."
  Source: "Foreign transaction fee: none (0%)"
  → supported = true (explicit confirmation of absence)

═══════════════════════════════════════════════════════════
COMPARATIVE / DERIVED CLAIMS
═══════════════════════════════════════════════════════════

Extract the comparison as its own claim, separate from the atomic facts.

Draft sentence: "5 nights per $10K — the same rate as 2 per $5K"
→ Three claims:
   1. "Business: 5 qualifying nights per $10K"  (atomic)
   2. "Personal: 2 qualifying nights per $5K"   (atomic)
   3. "Both earn at the same rate per dollar"   (comparison)

For the comparison: if both atomic numbers are in source, you may verify
the math directly (5/10000 = 0.0005, 2/5000 = 0.0004 → NOT same →
supported = false). Otherwise mark "unsupported".

═══════════════════════════════════════════════════════════
SEVERITY
═══════════════════════════════════════════════════════════

severity="high" if getting it wrong would mislead a reader's decision
(numbers, dates, partners, eligibility, comparisons). severity="low" for
harmless descriptive color.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "claims": [
    { "claim": "<under 150 chars>", "supported": true | false | "unsupported", "severity": "high"|"low", "source_excerpt": "<span>"|null }
  ]
}`

const SYSTEM_PROMPT_EXTRACT_ONLY = `You are the fact-checker for crazy4points, an award travel intelligence site.
A writer agent just produced a publish-ready article body. Your job: extract every falsifiable
factual claim from the body so a downstream web-verification pass can ground each claim against
real-time sources.

There is NO SOURCE_TEXT to compare against in this run. Do NOT mark anything supported=true.
All claims must be returned with supported="unsupported" so they flow into web verification.
(We use "unsupported" rather than false here because there's nothing to contradict against —
silence is the only possible state.)

═══════════════════════════════════════════════════════════
WHAT COUNTS AS A CLAIM
═══════════════════════════════════════════════════════════

Extract falsifiable claims:
• Numbers (bonus %, point amounts, prices, availability %)
• Dates (promo start/end, deadlines)
• Named programs, partners, properties, cards
• Specific benefits/rules ("no annual fee", "transfer ratio 1:1")
• Geographic or product claims

Skip:
• Opinions, brand-voice flourishes, calls to action
• Generic award-travel truisms
• Duplicates — extract each distinct fact once

Prefer FEWER high-quality claims over exhaustive extraction (max ~12).

═══════════════════════════════════════════════════════════
SEVERITY
═══════════════════════════════════════════════════════════

severity="high" if getting it wrong would mislead a reader's decision (numbers, dates,
partners, eligibility). severity="low" for harmless descriptive color.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences. Every entry MUST have
supported="unsupported" and source_excerpt=null since there is no source text.

{
  "claims": [
    { "claim": "<under 150 chars>", "supported": "unsupported", "severity": "high"|"low", "source_excerpt": null }
  ]
}`

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
 * we DID extract.
 *
 * Strategy: walk back from the point where parse fails to find the last
 * `}` that's followed only by whitespace/commas/newlines, then truncate
 * there and synthesize the array+object close.
 *
 * Caller still gets logging through the existing `console.error` if even
 * recovery fails, so we don't hide bugs.
 */
function parseJsonResilient(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch (err) {
    // Heuristic recovery for `{"claims": [ {...}, {...}, {... <truncated>` shape.
    const claimsIdx = raw.indexOf('"claims"')
    if (claimsIdx < 0) throw err
    const arrayStart = raw.indexOf('[', claimsIdx)
    if (arrayStart < 0) throw err
    // Find the last position where a claim object cleanly closes.
    // We scan for `}` followed by optional whitespace + (`,` | end-of-string).
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
    // Reconstruct: everything up to and including the last clean `}`,
    // then close the array and outer object.
    const repaired = raw.slice(0, lastCleanEnd + 1) + ']}'
    console.warn(
      `[verifyArticleBody] JSON truncated at position ${raw.length}; recovered ${
        // count claim-object opens we kept
        repaired.split('"claim"').length - 1
      } claims via repair.`
    )
    return JSON.parse(repaired)
  }
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
      // Three-state truth — preserve `'unsupported'` distinct from `false`.
      // Anything malformed defaults to `'unsupported'` so we don't assert
      // contradiction the model didn't actually claim.
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
}

export async function verifyArticleBody(args: {
  title: string
  article_body: string
  source_text: string | null
  /**
   * Phase 4 — optional labeled segments for per-slug grounding. When
   * provided, each Sonnet-returned claim gets a `source_slug` stamp
   * derived by matching its `source_excerpt` against segment text.
   * Pre-Phase-4 callers can omit this; pills just won't get per-slug
   * counts in that case.
   */
  source_segments?: SourceSegment[]
}): Promise<VerifyResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[verifyArticleBody] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  const sourceText = args.source_text?.trim()

  // Phase 2 — comparison-audit pre-pass (deterministic, no LLM).
  // Extract any <!-- comparison_audits: [...] --> block from the article
  // body, recompute the math, and synthesize VerifyClaim entries (one per
  // comparison). Strip the audit block from the body before sending to
  // Sonnet so the LLM doesn't double-extract the comparison as a natural-
  // language claim.
  // Also run the regex safety net: comparison words ("faster", "same rate",
  // "double", etc.) in prose with no matching audit entry → high-severity
  // unsupported synthetic claim, forcing the editor to revise or audit.
  const audits = extractComparisonAudits(args.article_body)
  const auditResults = verifyComparisonAudits(audits)
  const auditClaims = comparisonResultsToClaims(auditResults)
  const bodyForSonnet = stripComparisonAudits(args.article_body)
  const unauditedClaims = audits.length === 0 ? detectUnauditedComparisons(bodyForSonnet) : []

  // Two modes for the Sonnet pass (downstream of comparison audit):
  //   - With source_text: compare each claim against the source (existing behavior)
  //   - Without source_text: just extract the claims and mark them all unsupported
  //     so the downstream webVerifyClaims pass can ground them in real time.
  // The previous behavior (returning a single placeholder claim) prevented
  // web verification from running on the actual article claims.
  const systemPrompt = sourceText ? SYSTEM_PROMPT_WITH_SOURCE : SYSTEM_PROMPT_EXTRACT_ONLY
  const userPayload: Record<string, unknown> = {
    title: args.title,
    article_body: bodyForSonnet,
  }
  if (sourceText) {
    userPayload.source_text = sourceText
  }
  const userContent = JSON.stringify(userPayload, null, 2)

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      // Bumped from 2500 — long blog bodies (e.g. card-comparison articles)
      // produce 15-25 claims; at ~300 tokens each plus structure, 2500 was
      // truncating mid-array. 8000 leaves headroom; Sonnet 4.6 supports ~16K.
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })
    const block = message.content[0]
    if (!block || block.type !== 'text') return null
    // Use the resilient parser — recovers from mid-array truncation if we
    // ever do exceed max_tokens, instead of dropping every claim.
    let claims = validate(parseJsonResilient(extractJson(block.text)))
    // Belt-and-suspenders: when running without source text, force every
    // claim to supported='unsupported' even if the model accidentally
    // returned true or false. There's no source to confirm OR contradict
    // against, so silence is the only honest state.
    if (!sourceText) {
      claims = claims.map((c) => ({ ...c, supported: 'unsupported' as const, source_excerpt: null }))
    }
    // Phase 4 — stamp each Sonnet-returned claim with the slug of the
    // segment whose text contains the excerpt. Synthetic claims from the
    // comparison-audit pre-pass get fixed pseudo-slugs so the UI can
    // distinguish "this came from deterministic math" from "this came
    // from a T1 surface."
    const segments = args.source_segments ?? []
    const claimsWithSlug = claims.map((c) => ({
      ...c,
      source_slug: findSegmentForExcerpt(c.source_excerpt, segments),
    }))
    const auditClaimsWithSlug = auditClaims.map((c) => ({
      ...c,
      source_slug: 'comparison_audit' as const,
    }))
    const unauditedClaimsWithSlug = unauditedClaims.map((c) => ({
      ...c,
      source_slug: 'unaudited_comparison' as const,
    }))
    // Phase 2 — prepend deterministic comparison-audit results. These are
    // ground truth (we computed the math ourselves), so they take priority
    // over Sonnet's natural-language extraction.
    const merged = [...auditClaimsWithSlug, ...unauditedClaimsWithSlug, ...claimsWithSlug]
    return { claims: merged, checked_at: new Date().toISOString() }
  } catch (err) {
    console.error('[verifyArticleBody] Sonnet call failed:', err)
    return null
  }
}
