/**
 * Twitter (X) post variant generator. ≤280 chars hard cap. 1-2 hashtags.
 */
import {
  buildSystemPreamble,
  callSonnetForVariant,
  type GeneratedVariant,
  type VariantGenInput,
} from './shared'

export const FORMAT_NAME = 'twitter' as const
export const FORMAT_PROMPT_VERSION = 'v1-2026-05-18'

const FORMAT_RULES = `
FORMAT: TWITTER (X) POST

LENGTH: ≤280 characters HARD CAP. Sweet spot 71-100 chars (+17% engagement).

STRUCTURE:
  - Front-load value in the first 100 chars.
  - One link at the end (crazy4points URL — X auto-shortens to 23 chars).
  - 1-2 hashtags MAX. 3+ hashtags drops engagement by 17%; 5+ by 40%.

TONE: Punchy hook. Concrete numbers. No clickbait.

TITLE: null — tweets have no title slot.

METADATA TO RETURN:
  - hashtags: 1-2 strings, no # prefix
  - char_count: integer char count of body
  - thread: optional array of 2-4 follow-up tweet bodies if the topic
    deserves more depth (threads get 3x engagement of single tweets).
    Omit if a single tweet covers it.
  - cta_url: crazy4points URL

CRITICAL: The body string MUST be ≤280 chars (post-template), including the
link at the end. Count carefully.
`

export async function generateTwitter(
  input: VariantGenInput,
): Promise<GeneratedVariant> {
  const systemPrompt = buildSystemPreamble(input) + FORMAT_RULES
  const userPrompt = `Write the Twitter post variant. Title should be null.`
  return callSonnetForVariant({
    systemPrompt,
    userPrompt,
    caller: 'variant_twitter',
    topicId: input.topic.id,
    format: FORMAT_NAME,
    maxTokens: 1024,
  })
}
