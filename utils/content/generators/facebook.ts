/**
 * Facebook post variant generator. 40-200 words, 3-5 niche hashtags max.
 */
import {
  buildSystemPreamble,
  callSonnetForVariant,
  type GeneratedVariant,
  type VariantGenInput,
} from './shared'

export const FORMAT_NAME = 'facebook' as const
export const FORMAT_PROMPT_VERSION = 'v1-2026-05-18'

const FORMAT_RULES = `
FORMAT: FACEBOOK POST

LENGTH: 40-200 words. 1-3 short paragraphs. Sweet spot is 40-80 words.

STRUCTURE:
  - Conversational opening. Lead with the reader's payoff.
  - Concrete numbers from the ledger.
  - Close with a link to crazy4points.com/alerts/<slug> or /blog/<slug>.

HASHTAGS: 3-5 niche hashtags MAX. 10+ tanks engagement. Put them in
metadata.hashtags as an array WITHOUT the # prefix; they get appended after
the post body when published.

TONE:
  - Conversational, not corporate. Emoji OK sparingly (1-2 max).
  - NO engagement bait. "Comment below!" / "Tag a friend!" — banned.
  - NO clickbait.

TITLE: null — Facebook posts have no title slot.

METADATA TO RETURN:
  - hashtags: 3-5 strings, no # prefix
  - suggested_image_prompt: short text-to-image prompt for editor to render
  - cta_url: crazy4points URL the post links to
`

export async function generateFacebook(
  input: VariantGenInput,
): Promise<GeneratedVariant> {
  const systemPrompt = buildSystemPreamble(input) + FORMAT_RULES
  const userPrompt = `Write the Facebook post variant. Title should be null.`
  return callSonnetForVariant({
    systemPrompt,
    userPrompt,
    caller: 'variant_facebook',
    topicId: input.topic.id,
    format: FORMAT_NAME,
    maxTokens: 1024,
  })
}
