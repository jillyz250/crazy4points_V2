/**
 * Server-side only. Fact-checks a finished newsletter draft against the
 * source material the writer was given (referenced alerts + tagged program
 * pages). Returns a VerifyClaim[] using the same shape as the alert and
 * blog verifiers, so existing renderers work.
 *
 * Per Phase 6b — gives the editor visibility into any drift between the
 * newsletter prose and the underlying program-page facts before sending.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'
import type { ClaimSupportState, VerifyClaim, VerifyResult } from './verifyAlertDraft'
import type { NewsletterDraft } from './buildNewsletter'

export type { ClaimSupportState, VerifyClaim, VerifyResult } from './verifyAlertDraft'

export interface VerifyNewsletterInput {
  draft: NewsletterDraft
  /** All source material that was used to build the draft. Acts as ground truth. */
  source_text: string
}

const SYSTEM_PROMPT = `You are the fact-checker for crazy4points's weekly newsletter.

A newsletter draft was just written. Your job: extract every falsifiable
factual claim from the draft sections and decide whether each is supported
by the SOURCE_TEXT (which contains the referenced alerts + tagged program
page content the writer was given).

═══════════════════════════════════════════════════════════
WHAT COUNTS AS A CLAIM
═══════════════════════════════════════════════════════════

Extract from these sections only:
- the_headline (why_it_matters + what_to_do)
- quick_wins[] (blurbs)
- play_of_the_week (mechanic_explainer + best_uses[].why)
- heads_up[] (what + when)
- on_my_radar[] (why)

Skip jills_take entirely — that's opinion / voice, not fact-checkable.

Falsifiable claims:
• Numbers (point amounts, transfer ratios, percentages, dollar figures)
• Dates / deadlines / effective dates
• Named programs, partners, properties
• Specific mechanics ("transfers 1:1 to Hyatt", "category 8 peak rate")

Skip:
• Opinions, brand-voice flourishes, calls to action
• Generic award-travel truisms
• Soft framing ("might be worth a look", "decent value")

Prefer FEWER, higher-quality claims over exhaustive extraction.

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
  contradiction.

• supported = "unsupported"
  SOURCE_TEXT is silent. source_excerpt = null. Treated downstream as
  "we don't know," not "it's wrong" — often legit info that's true but
  absent from the source data we shipped to the writer.

Numbers and dates must match exactly. If unsure, choose "unsupported".

═══════════════════════════════════════════════════════════
NEGATIVE & COMPARATIVE CLAIMS
═══════════════════════════════════════════════════════════

• Negative claims ("X has no Y", "missing Z"): require POSITIVE evidence
  of absence in SOURCE_TEXT to mark supported=true. Source silence ≠ proof.
• Comparative claims ("same rate as", "faster than", "double"): extract
  the comparison itself as a separate claim. Verify the math from the
  atomic numbers if both are in source; otherwise mark "unsupported".

═══════════════════════════════════════════════════════════
SEVERITY
═══════════════════════════════════════════════════════════

severity="high" if getting it wrong would mislead a subscriber's decision —
numbers, dates, partner ratios, eligibility.

severity="low" for descriptive color that's wrong-but-harmless.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "claims": [
    {
      "claim": "<under 150 chars>",
      "supported": true | false | "unsupported",
      "severity": "high" | "low",
      "source_excerpt": "<span>" | null
    }
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
 * Resilient JSON parse — if Sonnet truncates the claims array, recover what
 * we can instead of throwing. Same heuristic as verifyArticleBody / verifyAlertDraft.
 */
function parseJsonResilient(raw: string): unknown {
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
      `[verifyNewsletterDraft] JSON truncated at position ${raw.length}; recovered ${
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

/**
 * Boils a NewsletterDraft down to the prose blocks the verifier should
 * fact-check. Skips voice-only fields (jills_take, subject_options).
 */
function draftToFactCheckText(draft: NewsletterDraft): string {
  const parts: string[] = []

  const headline = draft.the_headline ?? draft.big_one ?? null
  if (headline) {
    parts.push(`# THE HEADLINE\n${headline.headline}\n${headline.why_it_matters}\n${headline.what_to_do}`)
  }

  const quickWins = draft.quick_wins ?? draft.haul ?? []
  if (quickWins.length > 0) {
    parts.push(
      `# QUICK WINS\n` +
        quickWins.map((q) => `- ${q.headline}: ${q.blurb}`).join('\n'),
    )
  }

  const play = draft.play_of_the_week ?? draft.sweet_spot ?? null
  if (play) {
    const uses = (play.best_uses ?? []).map((u) => `  • ${u.name} — ${u.why}`).join('\n')
    parts.push(`# PLAY OF THE WEEK\n${play.topic}\n${play.mechanic_explainer}\n${uses}`)
  }

  const headsUp = draft.heads_up ?? []
  if (headsUp.length > 0) {
    parts.push(
      `# HEADS UP\n` +
        headsUp.map((h) => `- ${h.headline}: ${h.what} (${h.when})`).join('\n'),
    )
  }

  const radar = draft.on_my_radar ?? []
  if (radar.length > 0) {
    parts.push(`# ON MY RADAR\n` + radar.map((r) => `- ${r.headline}: ${r.why}`).join('\n'))
  }

  return parts.join('\n\n')
}

export async function verifyNewsletterDraft(args: VerifyNewsletterInput): Promise<VerifyResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[verifyNewsletterDraft] ANTHROPIC_API_KEY missing — skipping')
    return null
  }
  if (!args.source_text.trim()) {
    return {
      claims: [
        {
          claim: 'No source text available — newsletter claims are unverified.',
          supported: false,
          severity: 'high',
          source_excerpt: null,
        },
      ],
      checked_at: new Date().toISOString(),
    }
  }

  const draftText = draftToFactCheckText(args.draft)
  const userContent = JSON.stringify(
    { newsletter_prose: draftText, source_text: args.source_text },
    null,
    2,
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      // Bumped from 3000 — newsletters with many quick_wins / heads_up items
      // can produce 15+ claims and overflow. 6000 leaves headroom.
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(message, 'verifyNewsletterDraft')
    const block = message.content[0]
    if (!block || block.type !== 'text') return null
    const claims = validate(parseJsonResilient(extractJson(block.text)))
    return { claims, checked_at: new Date().toISOString() }
  } catch (err) {
    console.error('[verifyNewsletterDraft] Sonnet call failed:', err)
    return null
  }
}
