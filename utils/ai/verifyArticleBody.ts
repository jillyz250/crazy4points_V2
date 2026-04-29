/**
 * Fact-checks a drafted article body against its source context (source alert
 * description/summary + optional raw intel text). Returns VerifyClaim[] using
 * the same shape as verifyAlertDraft, so existing admin renderers work.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { VerifyClaim, VerifyResult } from './verifyAlertDraft'

export type { VerifyClaim, VerifyResult } from './verifyAlertDraft'

const SYSTEM_PROMPT_WITH_SOURCE = `You are the fact-checker for crazy4points, an award travel intelligence site.
A writer agent just produced a publish-ready article body. Your job: extract every falsifiable
factual claim from the body and determine whether each is supported by the SOURCE_TEXT.

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

Prefer FEWER high-quality claims over exhaustive extraction.

═══════════════════════════════════════════════════════════
GROUNDING
═══════════════════════════════════════════════════════════

supported=true: claim appears verbatim or as a direct paraphrase in SOURCE_TEXT; fill
source_excerpt (<200 chars).
supported=false: not in SOURCE_TEXT, or SOURCE_TEXT contradicts; source_excerpt=null.

Numbers and dates must match exactly.

═══════════════════════════════════════════════════════════
SEVERITY
═══════════════════════════════════════════════════════════

severity="high" if getting it wrong would mislead a reader's decision (numbers, dates,
partners, eligibility). severity="low" for harmless descriptive color.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "claims": [
    { "claim": "<under 150 chars>", "supported": true|false, "severity": "high"|"low", "source_excerpt": "<span>"|null }
  ]
}`

const SYSTEM_PROMPT_EXTRACT_ONLY = `You are the fact-checker for crazy4points, an award travel intelligence site.
A writer agent just produced a publish-ready article body. Your job: extract every falsifiable
factual claim from the body so a downstream web-verification pass can ground each claim against
real-time sources.

There is NO SOURCE_TEXT to compare against in this run. Do NOT mark anything supported=true.
All claims must be returned with supported=false so they flow into web verification.

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
supported=false and source_excerpt=null since there is no source text.

{
  "claims": [
    { "claim": "<under 150 chars>", "supported": false, "severity": "high"|"low", "source_excerpt": null }
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
      return {
        claim: raw.claim.trim().slice(0, 300),
        supported: raw.supported === true,
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
}): Promise<VerifyResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[verifyArticleBody] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  const sourceText = args.source_text?.trim()
  // Two modes:
  //   - With source_text: compare each claim against the source (existing behavior)
  //   - Without source_text: just extract the claims and mark them all unsupported
  //     so the downstream webVerifyClaims pass can ground them in real time.
  // The previous behavior (returning a single placeholder claim) prevented
  // web verification from running on the actual article claims.
  const systemPrompt = sourceText ? SYSTEM_PROMPT_WITH_SOURCE : SYSTEM_PROMPT_EXTRACT_ONLY
  const userPayload: Record<string, unknown> = {
    title: args.title,
    article_body: args.article_body,
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
    // claim to supported=false even if the model accidentally returned true.
    if (!sourceText) {
      claims = claims.map((c) => ({ ...c, supported: false, source_excerpt: null }))
    }
    return { claims, checked_at: new Date().toISOString() }
  } catch (err) {
    console.error('[verifyArticleBody] Sonnet call failed:', err)
    return null
  }
}
