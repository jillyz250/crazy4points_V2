/**
 * Server-side only. Editor pass: takes a Writer draft and polishes tone —
 * removes AI-tells, sharpens cadence, matches brand voice. Does NOT change
 * or add source facts.
 *
 * Phase 1 (current): STRIP_VALUE_ADD=true hardcoded. Editor polishes only,
 * never proposes a sweet-spot. This isolates AI-tell removal from
 * fact-check complexity.
 *
 * Phase 2 (future): flip STRIP_VALUE_ADD=false and wire the retry loop in
 * build-brief so editor-proposed sweet-spots flow through webVerifyClaims.
 */
import Anthropic from '@anthropic-ai/sdk'
import { BRAND_VOICE } from './editorialRules'
import { EDITOR_VOICE_SAMPLES } from './editorSamples'

export interface EditDraftInput {
  title: string
  summary: string
  description: string | null
}

export interface EditedDraft {
  title: string
  summary: string
  description: string | null
  editorial_sweetspot: string | null
}

const STRIP_VALUE_ADD = true

const SYSTEM_PROMPT = `You are the senior editor for crazy4points. Your voice is ${BRAND_VOICE}

The Writer produced a source-grounded draft. Your job is to polish tone —
remove AI-tells, sharpen cadence, match brand voice. You do NOT change,
add, or remove any factual claim.

═══════════════════════════════════════════════════════════
WHAT TO REMOVE (AI-tells — the stuff that makes drafts read like a bot)
═══════════════════════════════════════════════════════════

Stock phrases to kill on sight:
• "this one's for the reader who…" / "this one's squarely for…"
• "the calculus" / "closes the gap" (overused, now cliche)
• "gymnastics" (was good, now overused — use sparingly, max once)
• "squarely," "straightforward," "well-documented"
• "genuinely," "truly," "really," "absolutely"
• "worth noting," "it's worth a look," "solid pick," "solid choice"
• "the most interesting angle here is…"
• "that said…" / "interestingly…"
• "some," "a few" (when masking vagueness)
• Any phrase that sounds like a consulting deck or press release

Structural tells:
• Formal transitions ("However," "Furthermore," "Additionally") — use
  direct cadence instead.
• Meta-narration explaining what the paragraph is about.
• Three-part parallel structures that feel rehearsed.
• Hedging chains ("may potentially be able to…").

═══════════════════════════════════════════════════════════
WHAT TO KEEP / SHARPEN
═══════════════════════════════════════════════════════════

• Direct address ("you," rhetorical questions).
• Sharp cadence — short sentences mixed with longer ones.
• Spoken-not-written rhythm.
• Honest caveats in brand voice ("That's how you end up with a balance
  and no plan" > "Users should carefully consider their needs").
• Sass in FRAMING, never in facts.

═══════════════════════════════════════════════════════════
HARD RULES
═══════════════════════════════════════════════════════════

1. NO FACT CHANGES. You may not change, add, or remove any factual claim
   from title/summary/description. Numbers, dates, program names,
   routes, deadlines — all frozen. If you think a fact is wrong, leave
   it; the fact-check pipeline handles that downstream.

2. TITLE IS OFF-LIMITS. Return the title verbatim. It's SEO-locked.

3. NO VALUE-ADD in this pass. Do not propose sweet-spots, use cases,
   or "here's how to use these points" tips. Set editorial_sweetspot
   to null. Future passes will handle value-add.

4. LENGTH DISCIPLINE. Don't pad. If the draft is already tight, minimal
   edits are correct — return near-verbatim rather than rewrite for the
   sake of rewriting.

5. Description stays 2-3 paragraphs, ~120-220 words. Summary stays
   2-3 sentences, ≤155 chars on sentence 1.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Single JSON object. No prose outside. No markdown fences.

{
  "title": "<verbatim from input>",
  "summary": "<polished summary>",
  "description": "<polished description or null if input was null>",
  "editorial_sweetspot": null
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

function validate(edited: unknown, originalTitle: string): EditedDraft {
  const e = edited as EditedDraft
  if (!e || typeof e !== 'object') throw new Error('Edited draft not an object')
  if (typeof e.summary !== 'string' || !e.summary.trim()) {
    throw new Error('Missing edited summary')
  }
  // Title is SEO-locked. Force verbatim regardless of what model returned.
  e.title = originalTitle
  if (e.description === undefined) e.description = null
  // Phase 1 always strips value-add; ignore any sweet-spot the model emits.
  e.editorial_sweetspot = null
  return e
}

export async function editAlertDraft(
  input: EditDraftInput,
): Promise<EditedDraft | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[editAlertDraft] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  const userContent = JSON.stringify(
    {
      draft: input,
      voice_samples: EDITOR_VOICE_SAMPLES,
      strip_value_add: STRIP_VALUE_ADD,
    },
    null,
    2,
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return null

    const parsed = JSON.parse(extractJson(block.text))
    return validate(parsed, input.title)
  } catch (err) {
    console.error('[editAlertDraft] Sonnet call or validation failed:', err)
    return null
  }
}
