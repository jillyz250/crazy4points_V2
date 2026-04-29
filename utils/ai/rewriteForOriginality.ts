/**
 * Originality rewriter — takes a list of flagged passages from
 * originalityCheck() and rephrases each in the article body so it no longer
 * near-duplicates the matched external source. Preserves facts and brand
 * voice; only swaps the SHAPE of the prose (sentence rhythm, word order,
 * specific phrasing).
 *
 * Why a separate rewriter (not the existing rewriteArticleFromFacts):
 *   - rewriteArticleFromFacts is fact-driven — it discards unsupported
 *     claims. We don't want that here; the facts are fine, only the PROSE
 *     duplicates someone else's.
 *   - This is a surgical pass: only the flagged passages change. The rest
 *     of the article is preserved verbatim so we don't accidentally drift
 *     other passing passages.
 *
 * Returns the new full body. Caller should re-run fact-check + originality
 * on the new body before publishing — rephrasing CAN nudge facts subtly,
 * and the originality model might still find overlap if the rewrite
 * borrowed too much structure.
 */
import Anthropic from '@anthropic-ai/sdk'
import { BRAND_VOICE, FACTUAL_TRAPS } from './editorialRules'
import type { FlaggedPassage } from './originalityCheck'

const MODEL = 'claude-sonnet-4-6'

export interface RewriteForOriginalityInput {
  title: string
  /** Current article body, including any comparison_audits HTML comment. */
  current_body: string
  /** Passages to rewrite. Each must appear verbatim in current_body. */
  flagged_passages: FlaggedPassage[]
}

export interface RewriteForOriginalityResult {
  /** New full body — same length scale as input, with flagged passages rewritten. */
  body: string
  /** Per-passage: what was replaced + with what. Editor can audit. */
  changes: { before: string; after: string; reason: string }[]
  /** ISO timestamp. */
  rewritten_at: string
  /** Model identifier. */
  rewritten_by: string
}

function systemPrompt(): string {
  return `You are the originality editor for crazy4points. Your ONLY job is to rephrase
flagged passages so they no longer near-duplicate external published work, while preserving
facts and brand voice EXACTLY.

═══════════════════════════════════════════════════════════
HOW THIS WORKS
═══════════════════════════════════════════════════════════

You receive:
- title          — the article title (for context, do NOT change)
- current_body   — the full article body (markdown)
- flagged_passages — an array of { text, matched_url, matched_excerpt, why }
  Each .text appears VERBATIM somewhere in current_body. Your job is to
  rewrite each flagged passage in place, leaving everything else identical.

Return the FULL new body, plus a per-passage changes array showing what
you replaced and with what.

═══════════════════════════════════════════════════════════
HARD CONSTRAINTS — must-pass
═══════════════════════════════════════════════════════════

1. PRESERVE EVERY FACT. Numbers, dates, program names, partner ratios,
   property categories, percentages — all stay identical. If the flagged
   passage says "5 nights per $10K," the rewrite still says "5 nights per
   $10K." Same point amounts. Same deadlines. Same proper nouns.

2. PRESERVE THE comparison_audits HTML COMMENT BLOCK. If current_body
   contains a <!-- comparison_audits: [...] --> block, copy it through
   unchanged. The fact-checker depends on it.

3. PRESERVE EVERY OTHER PASSAGE VERBATIM. Don't fix typos, don't tighten
   prose, don't "improve" sentences that aren't flagged. Surgical edits
   only.

4. RESHAPE THE PROSE, not just synonyms. The point of the rewrite is to
   no longer match external published structure. Swap sentence order,
   change cadence, restructure how the same facts are introduced. A
   thesaurus pass alone won't fool an originality re-check.

5. STAY IN BRAND VOICE. The rewrite should still sound like crazy4points
   — short confident sentences, contractions, no corporate hedging.
   ${BRAND_VOICE}

${FACTUAL_TRAPS}

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose outside it. No markdown fences.

{
  "body": "<full rewritten markdown body — same shape as current_body, with only flagged passages rephrased>",
  "changes": [
    {
      "before": "<the original flagged passage, verbatim>",
      "after": "<the rephrased version that replaced it>",
      "reason": "<one sentence: what changed and why it no longer matches the external source>"
    }
  ]
}

If you cannot meaningfully rephrase a passage without losing facts (rare),
include it in changes with after === before and reason explaining why.
The editor will see the gap and decide.`
}

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

export async function rewriteForOriginality(
  input: RewriteForOriginalityInput
): Promise<RewriteForOriginalityResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[rewriteForOriginality] ANTHROPIC_API_KEY missing — skipping')
    return null
  }
  if (input.flagged_passages.length === 0) {
    // Nothing to rewrite — return the body unchanged.
    return {
      body: input.current_body,
      changes: [],
      rewritten_at: new Date().toISOString(),
      rewritten_by: 'noop',
    }
  }

  const userContent = JSON.stringify(
    {
      title: input.title,
      current_body: input.current_body,
      flagged_passages: input.flagged_passages.map((p) => ({
        text: p.text,
        matched_url: p.matched_url,
        matched_excerpt: p.matched_excerpt,
        why: p.why,
      })),
    },
    null,
    2
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: MODEL,
      // Long blog bodies need headroom; rewrites preserve length so we
      // need ~original_length tokens plus the changes array.
      max_tokens: 8000,
      system: systemPrompt(),
      messages: [{ role: 'user', content: userContent }],
    })
    // Concatenate all text blocks (consistent with writeArticleBody) so
    // we don't drop trailing tokens.
    const parts: string[] = []
    for (const b of message.content) {
      if (b.type === 'text' && b.text.trim()) parts.push(b.text)
    }
    if (parts.length === 0) return null
    const raw = parts.join('\n\n')
    const parsed = JSON.parse(extractJson(raw)) as {
      body?: unknown
      changes?: unknown
    }
    if (typeof parsed.body !== 'string' || !parsed.body.trim()) return null
    const changes = Array.isArray(parsed.changes)
      ? parsed.changes
          .map((c) => c as { before?: unknown; after?: unknown; reason?: unknown })
          .filter((c) => typeof c.before === 'string' && typeof c.after === 'string')
          .map((c) => ({
            before: (c.before as string).slice(0, 600),
            after: (c.after as string).slice(0, 600),
            reason: typeof c.reason === 'string' ? c.reason.slice(0, 300) : '',
          }))
      : []
    return {
      body: parsed.body.trim(),
      changes,
      rewritten_at: new Date().toISOString(),
      rewritten_by: MODEL,
    }
  } catch (err) {
    console.error('[rewriteForOriginality] Sonnet call failed:', err)
    return null
  }
}
