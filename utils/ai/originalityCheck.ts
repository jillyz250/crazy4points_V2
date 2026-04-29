/**
 * Originality v2 — confidence-scored, per-passage flagged.
 *
 * Up to now this returned `{ pass: boolean, notes: string }` — coarse and
 * uninformative. The editor couldn't tell HOW confident the model was, WHICH
 * passages tripped it, or what URL backed the flag. v2 returns:
 *
 *   - `confidence_score` (0-100): overall originality confidence, where
 *     100 = clearly original (nothing duplicate found) and 0 = a clear
 *     near-verbatim copy of an external source.
 *   - `threshold` (default 70): pass when confidence >= threshold. Editor
 *     can override per-idea (we persist the threshold applied so future
 *     re-checks remember the bar).
 *   - `pass` (boolean): convenience — confidence >= threshold.
 *   - `flagged_passages`: per-passage array with text, matched URL, matched
 *     excerpt, per-passage confidence, and a one-line "why" explainer.
 *
 * Self-plagiarism is OUT of scope by design — Jill's call. Only checks
 * against external publications.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'

export interface FlaggedPassage {
  /** The article passage that looks suspicious. ≤300 chars. */
  text: string
  /** URL of the source the model thinks this duplicates, or null if found via training memory only. */
  matched_url: string | null
  /** The closest matching span from the source page, ≤300 chars. */
  matched_excerpt: string | null
  /** Per-passage confidence — how much the MODEL thinks this is duplicate. Higher = more clearly duplicate. */
  confidence: number
  /** One short sentence: why the model flagged this. */
  why: string
}

export interface OriginalityResult {
  /** Convenience: true when confidence_score >= threshold. */
  pass: boolean
  /** Overall originality confidence, 0-100. 100 = clearly original. */
  confidence_score: number
  /** Threshold applied to compute `pass`. Editor can override per-idea. */
  threshold: number
  /** Editor-facing summary, 1-2 sentences. */
  notes: string
  /** Passages the model flagged as possibly duplicating external content. */
  flagged_passages: FlaggedPassage[]
  /** ISO timestamp when this check ran. */
  checked_at: string
}

/** Default originality bar — calibrated empirically. Override per-idea by setting `originality_threshold`. */
export const DEFAULT_ORIGINALITY_THRESHOLD = 70

const SYSTEM_PROMPT = `You are an originality checker for crazy4points. You receive an article body
and must use web_search to determine whether any passage near-duplicates content already
published elsewhere.

═══════════════════════════════════════════════════════════
HOW TO JUDGE
═══════════════════════════════════════════════════════════

Pick 3-6 distinctive passages from the body — sentences with specific phrasing, unusual word
choices, or memorable structure. Skip:
- Generic travel-rewards truisms ("points are worth more when transferred")
- Brand-voice flourishes that any writer would phrase the same way
- Direct factual claims (numbers, dates, program names) — every publication reports those identically
- Direct quotes the body explicitly attributes to a source

For each distinctive passage, web_search for short distinctive phrases. You have a small budget
(typically 6 searches) — spend them on passages most likely to overlap.

═══════════════════════════════════════════════════════════
SCORING — overall confidence (0-100)
═══════════════════════════════════════════════════════════

Score the article's overall originality:

  90-100  Clearly original. No matches found, or only generic-fact matches every site reports.
  75-89   Mostly original. Maybe 1 borderline phrase that overlaps a common turn of phrase but
          doesn't suggest copying.
  60-74   Concerning. One distinct passage closely echoes external published work, OR
          structural overlap (sentence rhythm, paragraph order) with a known piece even if no
          single sentence is verbatim.
  40-59   Likely problematic. Two or more passages near-verbatim with external sources, OR
          one passage that's clearly lifted.
  0-39    Plagiarism risk. A distinctive paragraph reads as copy-paste of prior published work,
          or several sentences are direct copies.

Be CALIBRATED, not lenient. The editor needs to trust the score — don't inflate to be nice.
A 75 should mean "I'd publish this comfortably"; a 60 should mean "give it another look."

═══════════════════════════════════════════════════════════
PER-PASSAGE FLAGS
═══════════════════════════════════════════════════════════

For every passage where you found OR suspect a match, emit a flagged_passages entry.
Even at high overall scores you can flag borderline passages — they help the editor decide.

  text             — the passage from the article (verbatim, ≤300 chars)
  matched_url      — the URL of the source you found, or null if training-memory-only
  matched_excerpt  — the closest span from the matching page (≤300 chars), or null
  confidence       — 0-100 confidence THIS passage is duplicate. 100 = certain copy.
  why              — one sentence: what overlaps and why it's a concern

Don't flag passages just to flag them. If you found nothing concerning, return an empty array.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "confidence_score": <0-100>,
  "notes": "<1-2 sentences explaining the score — what you searched, what you found or didn't>",
  "flagged_passages": [
    {
      "text": "<verbatim passage from article>",
      "matched_url": "<url or null>",
      "matched_excerpt": "<matching span or null>",
      "confidence": <0-100>,
      "why": "<one sentence>"
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

function findLastTextBlock(content: Anthropic.ContentBlock[]): string | null {
  for (let i = content.length - 1; i >= 0; i--) {
    const b = content[i]
    if (b.type === 'text' && b.text.trim()) return b.text
  }
  return null
}

function clampScore(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function sanitizePassage(raw: unknown): FlaggedPassage | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Partial<FlaggedPassage>
  if (typeof p.text !== 'string' || !p.text.trim()) return null
  return {
    text: p.text.trim().slice(0, 400),
    matched_url:
      typeof p.matched_url === 'string' && /^https?:\/\//.test(p.matched_url)
        ? p.matched_url
        : null,
    matched_excerpt:
      typeof p.matched_excerpt === 'string' ? p.matched_excerpt.slice(0, 400) : null,
    confidence: clampScore(p.confidence),
    why: typeof p.why === 'string' ? p.why.trim().slice(0, 300) : '',
  }
}

export interface OriginalityCheckArgs {
  title: string
  article_body: string
  /** Per-idea override. Defaults to DEFAULT_ORIGINALITY_THRESHOLD. */
  threshold?: number
}

export async function originalityCheck(
  args: OriginalityCheckArgs
): Promise<OriginalityResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[originalityCheck] ANTHROPIC_API_KEY missing — skipping')
    return null
  }
  const threshold = args.threshold ?? DEFAULT_ORIGINALITY_THRESHOLD

  const userContent = JSON.stringify({ title: args.title, article_body: args.article_body }, null, 2)

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }],
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(response, 'originalityCheck')
    const text = findLastTextBlock(response.content)
    if (!text) return null
    const parsed = JSON.parse(extractJson(text)) as {
      confidence_score?: unknown
      notes?: unknown
      flagged_passages?: unknown
    }
    const confidence_score = clampScore(parsed.confidence_score)
    const flagged_passages = Array.isArray(parsed.flagged_passages)
      ? parsed.flagged_passages.map(sanitizePassage).filter((p): p is FlaggedPassage => p !== null)
      : []
    const notes = typeof parsed.notes === 'string' ? parsed.notes.slice(0, 600) : ''
    return {
      pass: confidence_score >= threshold,
      confidence_score,
      threshold,
      notes,
      flagged_passages,
      checked_at: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[originalityCheck] call failed:', err)
    return null
  }
}
