/**
 * Fact-checks a drafted article body against its source context (source alert
 * description/summary + optional raw intel text). Returns VerifyClaim[] using
 * the same shape as verifyAlertDraft, so existing admin renderers work.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { VerifyClaim, VerifyResult } from './verifyAlertDraft'

export type { VerifyClaim, VerifyResult } from './verifyAlertDraft'

const SYSTEM_PROMPT = `You are the fact-checker for crazy4points, an award travel intelligence site.
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
  if (!sourceText) {
    return {
      claims: [
        {
          claim: 'No source text available — all article claims are unverified.',
          supported: false,
          severity: 'high',
          source_excerpt: null,
        },
      ],
      checked_at: new Date().toISOString(),
    }
  }

  const userContent = JSON.stringify(
    { title: args.title, article_body: args.article_body, source_text: sourceText },
    null,
    2,
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    const block = message.content[0]
    if (!block || block.type !== 'text') return null
    const claims = validate(JSON.parse(extractJson(block.text)))
    return { claims, checked_at: new Date().toISOString() }
  } catch (err) {
    console.error('[verifyArticleBody] Sonnet call failed:', err)
    return null
  }
}
