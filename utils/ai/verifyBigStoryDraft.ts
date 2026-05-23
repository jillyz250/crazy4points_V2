/**
 * Focused fact-check for the newsletter's Big Story article.
 *
 * Runs automatically after writeBigStoryHtml. Compares the generated article
 * body against the source alert's prose (summary + why_this_matters) and any
 * verified_terms (issuer T&Cs). Returns a per-claim verdict the editor
 * surfaces as chips above the article.
 *
 * Why Haiku (not Sonnet): single short article + small source bundle. Haiku
 * is the right model — cheaper, faster, plenty of capacity for grep-shape
 * fact-checking. The expensive judgment already happened upstream (Sonnet
 * wrote the article); this is a verification pass.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'
import type { VerifyClaim, VerifyResult } from './verifyAlertDraft'

export interface VerifyBigStoryInput {
  /** Generated article HTML (just the Big Story body). */
  big_story_html: string
  /** Source alert prose — summary + why_this_matters. */
  source_text: string
  /** Optional issuer T&Cs from the alert, treated as ground truth if present. */
  verified_terms?: string | null
}

const SYSTEM_PROMPT = `You are the fact-checker for crazy4points's weekly newsletter Big Story.

A Big Story article was just written from ONE source alert. Your job:
extract every falsifiable factual claim from the article and classify each
against SOURCE_TEXT and (when present) VERIFIED_TERMS.

═══════════════════════════════════════════════════════════
WHAT COUNTS AS A CLAIM
═══════════════════════════════════════════════════════════

Falsifiable:
• Dates, deadlines, effective dates, on-sale times (including time zone)
• Numbers (point amounts, transfer ratios, percentages, dollar figures, durations)
• Named programs, partners, properties, products
• Specific mechanics ("opens for cardmembers", "category 8 peak rate")
• Eligibility constraints ("Reserve cardmembers only", "must be enrolled")

Skip:
• Opinions, brand-voice flourishes, calls to action
• Generic award-travel truisms
• Soft framing ("worth a look", "decent value")

Prefer FEWER, higher-quality claims over exhaustive extraction. Aim for
3-8 claims per article.

═══════════════════════════════════════════════════════════
GROUNDING — THREE-STATE TRUTH MODEL
═══════════════════════════════════════════════════════════

Each claim must be classified into ONE of three states:

• supported = true
  SOURCE_TEXT or VERIFIED_TERMS explicitly confirms. Fill source_excerpt
  with the smallest quoted span (<200 chars). If from verified_terms,
  prefix with "VT: ".

• supported = false
  SOURCE_TEXT or VERIFIED_TERMS explicitly CONTRADICTS. source_excerpt =
  the contradicting span. Use ONLY when there is positive evidence of
  contradiction.

• supported = "unsupported"
  Source is silent on this claim. source_excerpt = null. Treated downstream
  as "we don't know" — often legit info that's true but absent from the
  source data the writer had.

Numbers, dates, and times must match exactly. "1pm ET" vs "1:00 PM EDT"
is fine. "1pm ET" vs "12pm ET" is NOT — supported=false.

═══════════════════════════════════════════════════════════
SEVERITY
═══════════════════════════════════════════════════════════

severity="high" if getting it wrong would mislead a subscriber's decision —
dates/times the subscriber is supposed to act on, partner ratios,
eligibility constraints, on-sale windows.

severity="low" for descriptive color (framing, tone) that's
wrong-but-harmless.

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (return ONLY this JSON, no prose, no fences)
═══════════════════════════════════════════════════════════

{
  "claims": [
    {
      "claim": "<the exact factual assertion, in plain English>",
      "supported": true | false | "unsupported",
      "severity": "high" | "low",
      "source_excerpt": "<quoted span from source, <200 chars, OR null>"
    }
  ]
}

If the article makes no falsifiable claims, return { "claims": [] }.`

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

export async function verifyBigStoryDraft(
  args: VerifyBigStoryInput,
): Promise<VerifyResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[verifyBigStoryDraft] ANTHROPIC_API_KEY missing — skipping')
    return null
  }
  if (!args.source_text.trim()) {
    return {
      claims: [
        {
          claim: 'No source text available — Big Story claims are unverified.',
          supported: false,
          severity: 'high',
          source_excerpt: null,
        },
      ],
      checked_at: new Date().toISOString(),
    }
  }

  const userContent = [
    '═══ ARTICLE ═══',
    args.big_story_html,
    '',
    '═══ SOURCE_TEXT ═══',
    args.source_text,
    args.verified_terms?.trim()
      ? `\n═══ VERIFIED_TERMS ═══\n${args.verified_terms}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(message, 'verifyBigStoryDraft')

    const block = message.content[0]
    if (block.type !== 'text') {
      console.error('[verifyBigStoryDraft] Non-text block returned')
      return null
    }
    const parsed = JSON.parse(extractJson(block.text)) as { claims?: unknown[] }
    const rawClaims = Array.isArray(parsed.claims) ? parsed.claims : []
    const claims: VerifyClaim[] = rawClaims
      .map((c): VerifyClaim | null => {
        const r = c as Partial<VerifyClaim>
        if (!r.claim || typeof r.claim !== 'string') return null
        const supported =
          r.supported === true ||
          r.supported === false ||
          r.supported === 'unsupported'
            ? r.supported
            : 'unsupported'
        return {
          claim: String(r.claim).slice(0, 600),
          supported,
          severity: r.severity === 'high' ? 'high' : 'low',
          source_excerpt:
            typeof r.source_excerpt === 'string'
              ? r.source_excerpt.slice(0, 240)
              : null,
        }
      })
      .filter((c): c is VerifyClaim => c !== null)
    return { claims, checked_at: new Date().toISOString() }
  } catch (err) {
    console.error('[verifyBigStoryDraft] Haiku call failed:', err)
    return null
  }
}
