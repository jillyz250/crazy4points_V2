/**
 * Originality v3.1 — source-comparison mode with web_search fallback.
 *
 * Default path: compare the article against the source text(s) it was drafted
 * from. That's where most plagiarism risk lives, and it costs ~90% less than
 * scanning the open web (v2 ran 55-69K input tokens / ~$0.20 per call).
 *
 * Fallback path: when NO sources are provided (hand-written articles with no
 * intel rows), run a budgeted web_search pass instead of skipping. Manual
 * articles still need an originality signal — silent-skip leaves the publish
 * gate stuck on "originality not run" forever.
 *
 * Self-plagiarism (overlap with prior crazy4points content) is OUT of scope —
 * Jill's call.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'

export interface FlaggedPassage {
  /** The article passage that looks suspicious. ≤300 chars. */
  text: string
  /** URL of the source the model thinks this duplicates, or null. */
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
  /** Passages the model flagged as possibly duplicating source content. */
  flagged_passages: FlaggedPassage[]
  /** ISO timestamp when this check ran. */
  checked_at: string
}

export const DEFAULT_ORIGINALITY_THRESHOLD = 80
export const MAX_PASSAGE_CONFIDENCE = 60

const SYSTEM_PROMPT_WEB = `You are an originality checker for crazy4points. You receive an article body
and must use web_search to detect passages that near-duplicate already-published external content.

═══════════════════════════════════════════════════════════
HOW TO JUDGE
═══════════════════════════════════════════════════════════

Pick 3-5 distinctive passages — sentences with specific phrasing, unusual word choices,
or memorable structure. Skip:
- Generic travel-rewards truisms
- Direct factual claims (numbers, dates, program names) — every publication reports those identically
- Direct quotes the body explicitly attributes to a source ("per CNBC", "told CNN", "X said")
- Sentences that overlap because every outlet is reporting the same press release on the
  same day (breaking-news convergence ≠ plagiarism)

Web_search short distinctive phrases. Budget is 4 searches — spend them on the passages
most likely to overlap.

CRITICAL: only include a flagged_passages entry when YOUR confidence the article copies
external work is at least 50. Convergent reporting, proper attribution, and shared press-
release facts are not plagiarism — do not list them as borderline flags. If you found
nothing concerning at confidence ≥50, return an empty array. Silence is the correct signal.

Before emitting any flag, verify the "text" field is a passage that actually appears in
the article body verbatim. Never include a flag where "text" is paraphrased from the
matched source — that's a hallucination, not a finding.

═══════════════════════════════════════════════════════════
SCORING — overall confidence (0-100)
═══════════════════════════════════════════════════════════

  90-100  Clearly original. No matches, or only generic-fact overlap every site reports.
  75-89   Mostly original. 1 borderline phrase that overlaps a common turn of phrase.
  60-74   Concerning. One distinct passage closely echoes external published work.
  40-59   Likely problematic. Two or more passages near-verbatim with external sources.
  0-39    Plagiarism risk. Distinctive paragraph reads as copy-paste of prior published work.

Be CALIBRATED. A 75 should mean "I'd publish comfortably"; a 60 means "give it another look."

═══════════════════════════════════════════════════════════
PER-PASSAGE FLAGS — same fields as source-comparison mode
═══════════════════════════════════════════════════════════

  text             — verbatim passage from article (≤300 chars)
  matched_url      — URL of source you found, or null if memory-only
  matched_excerpt  — closest matching span (≤300 chars), or null
  confidence       — 0-100, this passage's duplicate confidence
  why              — one sentence on the overlap

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "confidence_score": <0-100>,
  "notes": "<1-2 sentences>",
  "flagged_passages": [...]
}`

const SYSTEM_PROMPT = `You are an originality checker for crazy4points. You receive an article body
and the SOURCE TEXT(S) the article was drafted from. Your job: detect passages where the
article paraphrases the source too closely — i.e. plagiarism risk.

═══════════════════════════════════════════════════════════
WHAT TO CHECK
═══════════════════════════════════════════════════════════

Compare the article against the source text(s) below. Flag passages where the article:
  - Reuses a distinctive phrase, sentence rhythm, or paragraph structure from a source
  - Paraphrases a source so closely that swapping a few synonyms is the only change
  - Mirrors a source's metaphor, analogy, or framing without adding original perspective

DO NOT flag:
  - Direct factual claims (numbers, dates, program names) — facts overlap by necessity
  - Generic travel-rewards truisms ("points are worth more when transferred")
  - Brand-voice flourishes any writer would phrase the same way
  - Direct quotes the body explicitly attributes to a source ("per CNBC", "told CNN")
  - Sentences that overlap because they're paraphrasing the same primary press release

CRITICAL: only emit a flagged_passages entry when YOUR confidence is at least 50. Below
50 is noise — silence is the correct signal. If you found nothing concerning at ≥50,
return an empty array.

Before emitting any flag, verify "text" is a passage that actually appears in the article
body verbatim. Never include a flag where "text" is paraphrased from the matched source —
that's a hallucination, not a finding.

═══════════════════════════════════════════════════════════
SCORING — overall confidence (0-100)
═══════════════════════════════════════════════════════════

  90-100  Clearly original. Article uses its own phrasing throughout.
  75-89   Mostly original. Maybe 1 borderline phrase that echoes the source faintly.
  60-74   Concerning. One distinct passage paraphrases the source too closely.
  40-59   Likely problematic. Two or more passages mirror source phrasing.
  0-39    Plagiarism risk. Distinctive paragraphs read as paraphrased copy of the source.

Be CALIBRATED, not lenient. A 75 should mean "I'd publish comfortably"; a 60 means "give it
another look."

═══════════════════════════════════════════════════════════
PER-PASSAGE FLAGS
═══════════════════════════════════════════════════════════

For every passage where you found OR suspect a match, emit a flagged_passages entry.

  text             — the passage from the article (verbatim, ≤300 chars)
  matched_url      — the URL of the source it matches, or null if multiple sources / unclear
  matched_excerpt  — the closest span from the source (≤300 chars)
  confidence       — 0-100 confidence THIS passage paraphrases source. 100 = certain copy.
  why              — one sentence: what overlaps and why it's a concern

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "confidence_score": <0-100>,
  "notes": "<1-2 sentences explaining the score — what overlapped or didn't>",
  "flagged_passages": [
    {
      "text": "<verbatim passage from article>",
      "matched_url": "<url or null>",
      "matched_excerpt": "<matching span from source>",
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

export interface OriginalitySource {
  url: string | null
  text: string
}

export interface OriginalityCheckArgs {
  title: string
  article_body: string
  /**
   * Source(s) the article was drafted from. v3 compares the article against
   * these only — no web_search. If empty/undefined, the check is skipped.
   */
  sources?: OriginalitySource[]
  /** Per-idea override. Defaults to DEFAULT_ORIGINALITY_THRESHOLD. */
  threshold?: number
}

/** Cap source content sent to model so a giant scrape doesn't blow up tokens. */
const MAX_SOURCE_CHARS = 12_000

function buildSourcesBlock(sources: OriginalitySource[]): string {
  return sources
    .map((s, i) => {
      const text = (s.text ?? '').slice(0, MAX_SOURCE_CHARS).trim()
      const header = `--- SOURCE ${i + 1}${s.url ? ` (${s.url})` : ''} ---`
      return `${header}\n${text}`
    })
    .join('\n\n')
}

export async function originalityCheck(
  args: OriginalityCheckArgs
): Promise<OriginalityResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[originalityCheck] ANTHROPIC_API_KEY missing — skipping')
    return null
  }
  const sources = (args.sources ?? []).filter((s) => s && s.text && s.text.trim().length > 0)
  const threshold = args.threshold ?? DEFAULT_ORIGINALITY_THRESHOLD
  const useWebFallback = sources.length === 0

  const userContent = useWebFallback
    ? [`# ARTICLE TO CHECK`, `Title: ${args.title}`, ``, args.article_body].join('\n')
    : [
        `# ARTICLE TO CHECK`,
        `Title: ${args.title}`,
        ``,
        args.article_body,
        ``,
        `# SOURCE TEXT(S)`,
        buildSourcesBlock(sources),
      ].join('\n')

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: useWebFallback ? 3000 : 2000,
      system: useWebFallback ? SYSTEM_PROMPT_WEB : SYSTEM_PROMPT,
      ...(useWebFallback
        ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }] }
        : {}),
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
    // Phase 6 — post-process filter:
    //   (a) drop passages with confidence < 50 (noise floor — convergent
    //       reporting and proper attributions live there).
    //   (b) drop passages whose `text` doesn't actually appear in the article
    //       (model hallucination — flagging the source excerpt as the article
    //       passage). We compare loosely (whitespace-collapsed) to tolerate
    //       minor punctuation/spacing diffs the model may introduce.
    const normalized = args.article_body.replace(/\s+/g, ' ').toLowerCase()
    const flagged_passages = Array.isArray(parsed.flagged_passages)
      ? parsed.flagged_passages
          .map(sanitizePassage)
          .filter((p): p is FlaggedPassage => p !== null)
          .filter((p) => p.confidence >= 50)
          .filter((p) => normalized.includes(p.text.replace(/\s+/g, ' ').toLowerCase()))
      : []
    const notes = typeof parsed.notes === 'string' ? parsed.notes.slice(0, 600) : ''
    const worstPassage = flagged_passages.reduce(
      (max, p) => (p.confidence > max ? p.confidence : max),
      0,
    )
    const pass =
      confidence_score >= threshold && worstPassage < MAX_PASSAGE_CONFIDENCE
    return {
      pass,
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
