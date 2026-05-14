/**
 * Server-side only. Voice gate: scores a Writer/Editor draft against the
 * c4p-writer persona using Claude Haiku. Cheap (~$0.001/call) and fast (~1s).
 *
 * The persona file (utils/ai/personas/c4p-writer.md) is the authoritative
 * spec. The checker enforces:
 *   - Lead opens with one of the three rotation modes (A: stakes, B: visual,
 *     C: punchy) — not a program/brand name, not a press-release verb.
 *   - Zero banned phrases (see persona "Banned vocabulary" + AI-tell list).
 *   - No regular hyphens as pause punctuation. Em dashes ok in moderation.
 *   - Sounds like the persona, not like a bot.
 *
 * Returns a structured verdict. Callers decide what to do with a fail
 * (typical pattern: re-run writer with `voice_revise_notes`, then edit + check
 * again; cap at 1 retry).
 */
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { logUsage } from './logUsage'

const PERSONA_PATH = join(process.cwd(), 'utils/ai/personas/c4p-writer.md')
const C4P_WRITER_PERSONA = readFileSync(PERSONA_PATH, 'utf8')

export interface VoiceCheckInput {
  title: string
  summary: string
  description: string | null
}

export type LeadMode = 'A' | 'B' | 'C' | 'none'

export interface VoiceCheckResult {
  /** 1 (terrible — pure AI) to 5 (nails the persona). Pass threshold: >= 4. */
  score: 1 | 2 | 3 | 4 | 5
  lead_mode_detected: LeadMode
  banned_phrases_found: string[]
  em_dash_count: number
  hyphen_pause_count: number
  sounds_like_ai: boolean
  issues: string[]
  /** Pass = score >= 4 AND zero banned AND no hyphen-pause AND !sounds_like_ai */
  passed: boolean
}

const SYSTEM_PROMPT = `You are the voice quality gate for crazy4points. You receive a draft alert
(title, summary, description) and score it against the writer persona spec
below. Be strict. The goal is to catch AI-cadence drafts before a human
editor wastes time on them.

═══════════════════════════════════════════════════════════
WRITER PERSONA (the spec you are scoring against)
═══════════════════════════════════════════════════════════

${C4P_WRITER_PERSONA}

═══════════════════════════════════════════════════════════
WHAT TO RETURN
═══════════════════════════════════════════════════════════

Return ONLY valid JSON, no markdown fences, matching this exact schema:

{
  "score": 1 | 2 | 3 | 4 | 5,
  "lead_mode_detected": "A" | "B" | "C" | "none",
  "banned_phrases_found": [string array — exact substrings from the draft],
  "em_dash_count": number,
  "hyphen_pause_count": number,
  "sounds_like_ai": boolean,
  "issues": [string array — short specific notes, max 5]
}

═══════════════════════════════════════════════════════════
SCORING RUBRIC
═══════════════════════════════════════════════════════════

5 — Nails it. Reads like the persona. Hooks the reader, ties the deal to a
    concrete value-add, finds the trap, sounds human.
4 — Solid. Voice is there. Minor tightening would help but not required.
3 — Mid. Some voice flashes, but blocked by AI-cadence or generic openers.
    Needs a rewrite pass.
2 — Mostly AI-flavor. Press-release verbs, abstract value claims, no hook.
1 — Pure bot. Could appear on any points blog with a different brand name.

═══════════════════════════════════════════════════════════
LEAD MODE DETECTION
═══════════════════════════════════════════════════════════

Look at the FIRST sentence of the summary.

A — "Stakes + best friend." Direct address with empathy.
    Examples: "If you've been booking Airbnb Experiences anyway, you might
    as well get paid for it." / "Got a Qantas redemption lined up?"

B — "Conspiratorial + value-add." Visual, concrete, lets the reader in on
    what this actually unlocks.
    Examples: "Leading Hotels of the World is the kind of place that
    doesn't show up in a Marriott search — think private Italian villas..."

C — "Punchy + sass." Short sentences, attitude. Points often personified.
    Examples: "Your ThankYou points have been sitting there politely
    waiting." / "If you've been sitting on a stash of Hyatt points, the
    clock is ticking."

none — Opens with a program/brand name, a press-release verb (announces,
       rolls out, expands, is offering), or a generic news-recap framing.
       This is an automatic max-3 score.

═══════════════════════════════════════════════════════════
BANNED PHRASES — list EVERY occurrence in banned_phrases_found
═══════════════════════════════════════════════════════════

From the persona spec + standard AI-tells:
- genuinely, truly, really (as filler — not as part of a quoted phrase)
- reportedly, maximize, earn and burn, this is huge, you'd be crazy not to
- limited time only, expanded eligibility, rolls out, announces, is offering
- in the world of points, at the end of the day, let's dive in
- the headline X, the top of the ladder (meta-language about the article)
- "this one's for the reader who", "this one's squarely for"
- "the calculus", "closes the gap", "squarely", "well-documented"

═══════════════════════════════════════════════════════════
HYPHEN-PAUSE DETECTION
═══════════════════════════════════════════════════════════

Count occurrences of regular hyphens used as pause punctuation. Example:
"transfer now - the deadline is May 16" — that hyphen is a pause-punctuation
hyphen, not a word-joiner. Word-joining hyphens (e.g. "well-known", "long-haul")
do NOT count.

Em dashes (—) are tracked separately. Three or more em dashes in a single
paragraph is overuse and should appear in issues.

═══════════════════════════════════════════════════════════
SOUNDS_LIKE_AI
═══════════════════════════════════════════════════════════

True if the draft has any of:
- News-recap opener ("X program is offering...", "X has launched...")
- Three or more sentences starting with "If you..." (formulaic)
- Generic value claims without specifics ("great value", "solid deal")
- Press-release passive voice ("is being offered", "has been expanded")
- "Headline" or other meta-language about the article itself`

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\n([\s\S]*?)\n```/)
  if (fenced) return fenced[1]
  return text
}

function validate(parsed: unknown): VoiceCheckResult | null {
  if (!parsed || typeof parsed !== 'object') return null
  const o = parsed as Record<string, unknown>
  const score = o.score
  if (typeof score !== 'number' || score < 1 || score > 5) return null
  const lead = o.lead_mode_detected
  if (lead !== 'A' && lead !== 'B' && lead !== 'C' && lead !== 'none') return null
  const banned = Array.isArray(o.banned_phrases_found)
    ? (o.banned_phrases_found as unknown[]).filter((x): x is string => typeof x === 'string')
    : []
  const issues = Array.isArray(o.issues)
    ? (o.issues as unknown[]).filter((x): x is string => typeof x === 'string')
    : []
  const em = typeof o.em_dash_count === 'number' ? o.em_dash_count : 0
  const hp = typeof o.hyphen_pause_count === 'number' ? o.hyphen_pause_count : 0
  const sai = typeof o.sounds_like_ai === 'boolean' ? o.sounds_like_ai : false

  const passed =
    score >= 4 && banned.length === 0 && hp === 0 && !sai && lead !== 'none'

  return {
    score: score as 1 | 2 | 3 | 4 | 5,
    lead_mode_detected: lead,
    banned_phrases_found: banned,
    em_dash_count: em,
    hyphen_pause_count: hp,
    sounds_like_ai: sai,
    issues,
    passed,
  }
}

export async function voiceCheckDraft(
  draft: VoiceCheckInput
): Promise<VoiceCheckResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[voiceCheckDraft] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  const userContent = JSON.stringify(
    {
      title: draft.title,
      summary: draft.summary,
      description: draft.description,
    },
    null,
    2
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(message, 'voiceCheckDraft')

    const block = message.content[0]
    if (block.type !== 'text') return null

    const parsed = JSON.parse(extractJson(block.text))
    return validate(parsed)
  } catch (err) {
    console.error('[voiceCheckDraft] Haiku call or validation failed:', err)
    return null
  }
}

/**
 * Convenience: turn a VoiceCheckResult into a writer-friendly instruction
 * block. Pass this back through writeAlertDraft as voice_revise_notes so
 * the next attempt addresses the specific issues.
 */
export function formatVoiceFeedback(result: VoiceCheckResult): string {
  const parts: string[] = []
  parts.push(`PRIOR DRAFT FAILED VOICE CHECK (score: ${result.score}/5).`)
  if (result.lead_mode_detected === 'none') {
    parts.push(
      `Lead opener does not match any of the three rotation modes (A: stakes, B: visual, C: punchy). Rewrite the first sentence of the summary in one of these modes. Do NOT open with a program/brand name or a press-release verb.`
    )
  }
  if (result.banned_phrases_found.length > 0) {
    parts.push(
      `Remove these banned phrases verbatim: ${result.banned_phrases_found.map((p) => `"${p}"`).join(', ')}.`
    )
  }
  if (result.hyphen_pause_count > 0) {
    parts.push(
      `Found ${result.hyphen_pause_count} regular hyphen(s) used as pause punctuation. Replace with periods, commas, or em dashes.`
    )
  }
  if (result.sounds_like_ai) {
    parts.push(
      `Draft reads like AI. Tighten with specific value-add (concrete redemptions, named hotels/routes, traps) and at least one moment of voice (best-friend register from the persona).`
    )
  }
  if (result.issues.length > 0) {
    parts.push(`Specific issues to fix:\n- ${result.issues.join('\n- ')}`)
  }
  return parts.join('\n\n')
}
