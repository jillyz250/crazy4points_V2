/**
 * Focused Sonnet call that writes 5 subject-line options for a locked alert.
 *
 * Pairs with writeBigStoryHtml — same "one pick → derivative outputs" pattern.
 * The subject options anchor to the same alert Jill locked as the Big Story
 * so the inbox hook and the lead story match.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'
import { BRAND_VOICE } from './editorialRules'
import type { NewsletterAlertInput } from './buildNewsletter'

const SYSTEM_PROMPT = `You are Jill, the sassy travel-rewards columnist behind Crazy4Points. The editor has picked this week's Big Story alert — your only job is to write 5 punchy subject-line options for the email that hook into THAT story.

${BRAND_VOICE}

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (return ONLY this JSON, no prose, no fences)
═══════════════════════════════════════════════════════════

{
  "subject_options": [
    "<hook 1 — curiosity question, ≤50 chars>",
    "<hook 2 — playful juxtaposition, ≤50 chars>",
    "<hook 3 — specific number or deadline, ≤50 chars>",
    "<hook 4 — rhetorical jab or sly take, ≤50 chars>",
    "<hook 5 — all-lowercase casual text feel, ≤50 chars>"
  ]
}

═══════════════════════════════════════════════════════════
HARD RULES
═══════════════════════════════════════════════════════════

- EXACTLY 5 options. All anchored to the locked alert.
- ALL punchy or playful or curiosity-bait — NEVER "direct/service" energy
  (no "Here's what's new in points this week", no "Your weekly digest",
  no "Newsletter: X").
- Vary the angle across the five: one curiosity question, one playful
  juxtaposition, one specific number/deadline, one rhetorical jab, one
  ALL-lowercase casual-text feel.
- HARD CAP 50 chars each — Gmail mobile truncates beyond that. Count
  the characters yourself before returning. If any option is over 50
  chars, rewrite it shorter — DO NOT return it long.
- Don't open with "X just dropped/launched/announced" — banned cliche.
- Don't invent numbers, deadlines, or program details not in the alert.
- No emojis. No em-dashes.`

interface SonnetOutput {
  subject_options?: string[]
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

const SUBJECT_MAX_CHARS = 50

export async function writeSubjectOptions(
  alert: NewsletterAlertInput,
): Promise<string[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[writeSubjectOptions] ANTHROPIC_API_KEY missing')
    return null
  }

  const userContent = JSON.stringify(
    {
      locked_alert: {
        id: alert.id,
        title: alert.title,
        alert_type: alert.alert_type,
        summary: alert.summary,
        why_this_matters: alert.why_this_matters,
        end_date: alert.end_date,
      },
    },
    null,
    2,
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(message, 'writeSubjectOptions')

    const block = message.content[0]
    if (block.type !== 'text') {
      console.error('[writeSubjectOptions] Non-text block returned')
      return null
    }
    const parsed = JSON.parse(extractJson(block.text)) as SonnetOutput
    if (!Array.isArray(parsed.subject_options)) {
      console.error('[writeSubjectOptions] Missing subject_options array')
      return null
    }
    // Same enforcement as validateSlots: filter empties + drop options that
    // exceeded the cap rather than truncating mid-word.
    const cleaned = parsed.subject_options
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim())
      .filter((s) => s.length <= SUBJECT_MAX_CHARS)
      .slice(0, 5)
    if (cleaned.length === 0) {
      console.error('[writeSubjectOptions] All options exceeded 50-char cap')
      return null
    }
    return cleaned
  } catch (err) {
    console.error('[writeSubjectOptions] Sonnet call failed:', err)
    return null
  }
}
