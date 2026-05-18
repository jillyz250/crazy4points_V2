/**
 * Instagram caption variant generator. 138-150 chars caption (or 800-1500
 * carousel). Hashtags in first comment (NOT caption). 5-hashtag cap.
 */
import {
  buildSystemPreamble,
  callSonnetForVariant,
  type GeneratedVariant,
  type VariantGenInput,
} from './shared'

export const FORMAT_NAME = 'instagram' as const
export const FORMAT_PROMPT_VERSION = 'v1-2026-05-18'

const FORMAT_RULES = `
FORMAT: INSTAGRAM CAPTION

LENGTH:
  - Single-image post: 138-150 chars total.
  - Carousel/educational: 800-1500 chars.
  - First 125 chars shown before "...more" — front-load the hook.

HASHTAGS: 5-hashtag cap (platform-enforced since Dec 2025). Put hashtags in
metadata.first_comment_text — NOT in the caption body. The editor posts the
caption, then the first-comment hashtags as a follow-up reply.

VISUAL: Instagram is image-first. ALWAYS suggest an image prompt.

TONE:
  - Emoji encouraged (supports tone). 1-3 emoji max.
  - NO engagement bait.

TITLE: null — IG posts have no title slot.

METADATA TO RETURN:
  - first_comment_text: 1-5 hashtags as a single string, with # prefix
  - suggested_image_prompt: text-to-image prompt for hero image
  - is_carousel: boolean — true if body is the 800-1500 char carousel form
  - char_count: integer char count of body
  - cta_url: crazy4points URL (note: IG doesn't make caption links clickable
    — include "link in bio" framing if appropriate)
`

export async function generateInstagram(
  input: VariantGenInput,
): Promise<GeneratedVariant> {
  const systemPrompt = buildSystemPreamble(input) + FORMAT_RULES
  const userPrompt = `Write the Instagram caption variant. Title should be null.`
  return callSonnetForVariant({
    systemPrompt,
    userPrompt,
    caller: 'variant_instagram',
    topicId: input.topic.id,
    format: FORMAT_NAME,
    maxTokens: 1024,
  })
}
