/**
 * Alert variant generator (PR 3 of content system rehaul).
 * Renders to /alerts/<topic.slug>. 200-400 words, inverted pyramid, no
 * hashtags, no emoji in headlines.
 */
import {
  buildSystemPreamble,
  callSonnetForVariant,
  type GeneratedVariant,
  type VariantGenInput,
} from './shared'

export const FORMAT_NAME = 'alert' as const
export const FORMAT_PROMPT_VERSION = 'v1-2026-05-18'

const FORMAT_RULES = `
FORMAT: ALERT (renders at crazy4points.com/alerts/<slug>)

LENGTH: 200-400 words. Scannable. No walls of text.

STRUCTURE (inverted pyramid — most important fact first):
  1. Hook line — one sentence stating the offer + the deadline.
  2. The numbers — bullet list (markdown -) of offer amount, cap, eligibility,
     end date.
  3. What it means — 1-2 short paragraphs with stacking math and dollar-value
     examples (only using ledger facts).
  4. How to activate — numbered steps.
  5. The catch — honest caveats: targeted offer, T&C, exclusions.

CONVENTIONS:
  - Title: include the deadline if <30 days remain. No emoji. No ALL CAPS.
  - Body: markdown. Use \`##\` for the section headers (The numbers / What
    it means / How to activate / The catch).
  - No hashtags. No emoji in headings.
  - End with a CTA sentence pointing at the action ("Activate by Jun 30.").
    Do NOT use "Click here".

METADATA TO RETURN:
  - end_date: ISO date string if the offer has a deadline (else null)
  - action_type: short verb phrase ("Activate offer", "Transfer points", etc.)
  - source_url: the most-relevant issuer URL from the ledger
`

export async function generateAlert(
  input: VariantGenInput,
): Promise<GeneratedVariant> {
  const systemPrompt = buildSystemPreamble(input) + FORMAT_RULES
  const userPrompt = `Write the alert variant. Title is required.`
  return callSonnetForVariant({
    systemPrompt,
    userPrompt,
    caller: 'variant_alert',
    topicId: input.topic.id,
    format: FORMAT_NAME,
    maxTokens: 2048,
  })
}
