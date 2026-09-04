/**
 * Server-side only. Drafts ONE program-page "quirk" bullet from a verified
 * change signal, in the site's house style, using Claude Haiku. Never import
 * this from client components.
 *
 * The draft is ALWAYS shown to the editor for review/edit before it is written
 * (feedback_always_show_draft_before_publish). This helper only produces the
 * starting text; it never writes to the database.
 */
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'

export interface QuirkDraftInput {
  programName: string
  programSlug: string
  signalType: string
  summary: string
  sourceUrl: string | null
}

/**
 * Enforce the hard house-style rules on a quirk bullet, regardless of whether
 * the text came from Haiku or from the editor's hand-edit:
 *   - collapse to a single line (quirks are a newline-delimited bullet list)
 *   - strip em/en dashes (rule: commas/periods/parentheses/colons only)
 *   - guarantee a leading "- " Markdown bullet
 *   - cap length
 */
export function sanitizeQuirkBullet(text: string): string {
  let s = (text ?? '').replace(/\r/g, ' ').replace(/\n+/g, ' ').trim()
  // Em dash / en dash / figure dash / horizontal bar -> comma (never a dash).
  s = s.replace(/\s*[‒–—―]\s*/g, ', ')
  s = s.replace(/\s{2,}/g, ' ').trim()
  if (!s) return ''
  // Normalize the leading bullet marker. Only strip a real bullet (-, *, • that
  // is FOLLOWED by whitespace) so a bold label's opening "**" is never eaten.
  s = s.replace(/^\s*[-*•]\s+/, '')
  s = `- ${s}`
  // Guard against a runaway generation.
  if (s.length > 320) s = s.slice(0, 317).trimEnd() + '...'
  return s
}

function buildFallbackDraft(input: QuirkDraftInput): string {
  return sanitizeQuirkBullet(`**${input.programName}** ${input.summary}`)
}

export async function draftProgramQuirk(input: QuirkDraftInput): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return buildFallbackDraft(input)

  const prompt = [
    `You draft ONE "quirk" bullet for a loyalty-program reference page, in the site's house style.`,
    ``,
    `HOUSE STYLE (follow EXACTLY):`,
    `- Output a SINGLE Markdown bullet on ONE line: "- " then a short bold label in **double asterisks**, then a factual sentence or two.`,
    `- Example shape: "- **Radisson transfers to Finnair** Radisson Rewards points now convert to Finnair Plus Avios, confirmed by Finnair in September 2026."`,
    `- Punctuation: use ONLY commas, periods, parentheses, and colons. NEVER use an em dash or en dash.`,
    `- State ONLY the concrete change in the signal below. Do NOT invent partners, ratios, dates, fees, or numbers that are not in the summary.`,
    `- No foreign-currency valuations. No derived point math (do not compute cents-per-point, totals, or "worth $X").`,
    `- Keep it under 240 characters. Return ONLY the bullet line, nothing else.`,
    ``,
    `PROGRAM: ${input.programName} (${input.programSlug})`,
    `CHANGE TYPE: ${input.signalType}`,
    `VERIFIED SIGNAL SUMMARY: "${input.summary}"`,
    input.sourceUrl ? `SOURCE: ${input.sourceUrl}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })
    await logUsage(message, 'draftProgramQuirk', { programSlug: input.programSlug, signalType: input.signalType })

    const block = message.content.find((c) => c.type === 'text')
    if (block && block.type === 'text' && block.text.trim()) {
      return sanitizeQuirkBullet(block.text)
    }
    return buildFallbackDraft(input)
  } catch (err) {
    console.error('[draftProgramQuirk] Anthropic call failed:', err)
    return buildFallbackDraft(input)
  }
}
