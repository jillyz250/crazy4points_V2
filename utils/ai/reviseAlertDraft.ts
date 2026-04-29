/**
 * Server-side only. Calls Claude Sonnet 4.6 to revise a draft alert when the
 * web-verify pass flagged one or more claims as `likely_wrong`. The reviser
 * rewrites the draft to match web evidence while staying in brand voice,
 * then returns the updated title/summary/description + a per-change reason.
 *
 * Used by /api/build-brief (Phase 1: one-shot) to close the loop between
 * "claim is wrong" and "final copy is right" so the emailed brief is
 * publishable without manual editing.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'
import { BRAND_VOICE, FACTUAL_TRAPS } from './editorialRules'
import type { VerifyClaim } from './verifyAlertDraft'

export interface ReviseDraftInput {
  title: string
  summary: string
  description: string | null
}

export interface RevisionLogEntry {
  iter: number
  changed_fields: Array<'title' | 'summary' | 'description'>
  reason: string
  source_url: string | null
  before_claim: string
  after_claim: string
}

export interface ReviseResult {
  revised: ReviseDraftInput
  log: RevisionLogEntry[]
}

const SYSTEM_PROMPT = `You are the revising editor for crazy4points.
A writer agent produced a draft; a web fact-check found that one or more claims in the draft
are LIKELY WRONG based on authoritative sources. Your job: rewrite the draft so every flagged
claim matches the web evidence, while staying in brand voice and preserving the reader's action.

Voice: ${BRAND_VOICE}

═══════════════════════════════════════════════════════════
NO FABRICATION (highest-priority rule — overrides everything else)
═══════════════════════════════════════════════════════════

Every factual claim in the revised draft MUST be supported by the original
raw_text, the web_evidence for a flagged claim, or plainly true by public
record. This applies to title, summary, description — all output.

When correcting a flagged claim, the corrected phrasing comes from the
web_evidence provided — not from your own travel knowledge. Do not add
specifics (award prices, transfer ratios, sweet spots, program
comparisons) that aren't in the evidence.

If the evidence hedges ("rolling out across programs"), the corrected
copy hedges too. If you can't specify which programs are live today, say
"check award availability" rather than inventing a list. Vague-but-true
beats specific-but-fabricated, every time.

Sass lives in FRAMING (direct address, playful cadence), never in
invented facts.

${FACTUAL_TRAPS}

═══════════════════════════════════════════════════════════
WHAT TO CHANGE
═══════════════════════════════════════════════════════════

For each PROBLEM_CLAIM given:
• Replace the wrong framing with what the evidence actually says.
• Keep the same call-to-action, same deadline, same programs — unless those were themselves wrong.
• Do not hedge into mush. If the evidence says "bookable in the coming weeks," say that directly.
  Avoid "may", "could potentially", "reportedly". Pick the clearer truthful phrasing.
• Cite no URLs inline — the source stays on the alert card, not in the prose.

═══════════════════════════════════════════════════════════
WHAT NOT TO TOUCH
═══════════════════════════════════════════════════════════

• Claims that were NOT flagged stay exactly as written (same words, same order).
• Do not introduce new factual claims that weren't in the original or the web evidence.
• Do not change the title unless the title itself contained a flagged claim.
• Do not lengthen the draft. Edits should be surgical.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "revised": {
    "title": "<string>",
    "summary": "<string>",
    "description": "<string or null>"
  },
  "log": [
    {
      "changed_fields": ["summary" | "description" | "title"],
      "reason": "<one plain-English sentence on what changed and why, under 200 chars>",
      "source_url": "<the web_url from the flagged claim, or null>",
      "before_claim": "<the flagged claim text>",
      "after_claim": "<the revised phrasing that replaced it>"
    }
  ]
}

One log entry per flagged claim you addressed. If the draft already matches the evidence on a
claim (rare), include the entry with an empty changed_fields array and a reason explaining why
no edit was needed.`

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

function validate(parsed: unknown, iter: number): ReviseResult {
  const obj = parsed as { revised?: Partial<ReviseDraftInput>; log?: unknown[] }
  if (!obj || typeof obj !== 'object') throw new Error('revised result not an object')
  const r = obj.revised
  if (!r || typeof r.title !== 'string' || typeof r.summary !== 'string') {
    throw new Error('revised missing title/summary')
  }
  const revised: ReviseDraftInput = {
    title: r.title.trim(),
    summary: r.summary.trim(),
    description: typeof r.description === 'string' ? r.description.trim() : null,
  }
  const logIn = Array.isArray(obj.log) ? obj.log : []
  const log: RevisionLogEntry[] = []
  for (const entry of logIn) {
    const e = entry as Partial<RevisionLogEntry>
    if (!e || typeof e.reason !== 'string') continue
    const changed = Array.isArray(e.changed_fields)
      ? e.changed_fields.filter((f): f is 'title' | 'summary' | 'description' =>
          f === 'title' || f === 'summary' || f === 'description'
        )
      : []
    log.push({
      iter,
      changed_fields: changed,
      reason: e.reason.slice(0, 400),
      source_url:
        typeof e.source_url === 'string' && /^https?:\/\//.test(e.source_url)
          ? e.source_url
          : null,
      before_claim: typeof e.before_claim === 'string' ? e.before_claim.slice(0, 300) : '',
      after_claim: typeof e.after_claim === 'string' ? e.after_claim.slice(0, 300) : '',
    })
  }
  return { revised, log }
}

/**
 * Rewrites the draft so every `likely_wrong` claim is corrected to match
 * web evidence. Throws on API/parse failure — caller logs to system_errors.
 */
export async function reviseAlertDraft(args: {
  draft: ReviseDraftInput
  problem_claims: VerifyClaim[] // claims with web_verdict === 'likely_wrong'
  source_url: string | null
  iter?: number
}): Promise<ReviseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('reviseAlertDraft: ANTHROPIC_API_KEY missing')
  const iter = args.iter ?? 1

  const userContent = JSON.stringify(
    {
      draft: args.draft,
      source_url: args.source_url,
      problem_claims: args.problem_claims.map((c) => ({
        claim: c.claim,
        web_verdict: c.web_verdict,
        web_evidence: c.web_evidence,
        web_url: c.web_url,
        severity: c.severity,
      })),
    },
    null,
    2
  )

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  })
  await logUsage(response, 'reviseAlertDraft')

  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  if (!block) throw new Error('reviseAlertDraft: no text block in response')

  const parsed = JSON.parse(extractJson(block.text))
  return validate(parsed, iter)
}
