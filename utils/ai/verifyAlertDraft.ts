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

export interface VerifyClaim {
  claim: string
  supported: boolean
  severity: 'high' | 'low'
  source_excerpt: string | null
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

export async function verifyAlertDraft(args: {
  draft: { title: string; summary: string; description: string | null }
  raw_text: string | null
  source_url: string | null
}): Promise<VerifyResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[verifyAlertDraft] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  const sourceText = args.raw_text?.trim()
  if (!sourceText) {
    // Nothing to ground against — return a single low-severity sentinel so the
    // admin UI can show "no source text to verify" instead of silent pass.
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
      claims,
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
