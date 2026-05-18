/**
 * LinkedIn post variant generator. 1,300-1,900 chars (counter-intuitively
 * long). Single-line paragraphs for mobile. 3-5 hashtags at the end.
 */
import {
  buildSystemPreamble,
  callSonnetForVariant,
  type GeneratedVariant,
  type VariantGenInput,
} from './shared'

export const FORMAT_NAME = 'linkedin' as const
export const FORMAT_PROMPT_VERSION = 'v1-2026-05-18'

const FORMAT_RULES = `
FORMAT: LINKEDIN POST

LENGTH: 1,300-1,900 chars (+47% engagement vs shorter LinkedIn posts).
First 210-235 chars critical — that's what's visible before "...see more".

STRUCTURE:
  - Hook in first 210 chars. Make the value prop unmistakable.
  - Single-line paragraphs (one sentence each). White space adds ~20% read time.
  - 3-5 hashtags at the END of the post body (not in metadata).

TONE: Professional but warm. Less snark than Facebook. "For travel-points
enthusiasts" framing OK. Likes count less than saves; thoughtful comments
(10+ words) are the strongest signal — write to provoke thought, not
applause.

TITLE: null — LinkedIn posts have no title slot.

METADATA TO RETURN:
  - hashtags: 3-5 strings, no # prefix (they're also in the body; the array
    is for inventory tracking)
  - char_count: integer char count of body
  - cta_url: crazy4points URL appended near the end
`

export async function generateLinkedin(
  input: VariantGenInput,
): Promise<GeneratedVariant> {
  const systemPrompt = buildSystemPreamble(input) + FORMAT_RULES
  const userPrompt = `Write the LinkedIn post variant. Title should be null.`
  return callSonnetForVariant({
    systemPrompt,
    userPrompt,
    caller: 'variant_linkedin',
    topicId: input.topic.id,
    format: FORMAT_NAME,
    maxTokens: 1536,
  })
}
