/**
 * Threads (Meta) post variant generator. ≤500 char hard cap. 1-2 Topic Tags.
 */
import {
  buildSystemPreamble,
  callSonnetForVariant,
  type GeneratedVariant,
  type VariantGenInput,
} from './shared'

export const FORMAT_NAME = 'threads' as const
export const FORMAT_PROMPT_VERSION = 'v1-2026-05-18'

const FORMAT_RULES = `
FORMAT: THREADS POST

LENGTH: ≤500 chars HARD CAP (Meta enforces). Sweet spot still under 200.

STRUCTURE:
  - Conversational, timely, current-event-relevant. Threads' algorithm
    rewards timely content + meaningful discussion.
  - Native posts (no external link) perform better than link-out posts.
    If linking out, put the link at the end and don't lead with it.

TOPIC TAGS: 1-2 max. These are Threads' native version of hashtags — they
help posts surface in search/explore. Each topic tag eats your 500-char
budget, so use sparingly.

TONE: Conversational, current. Replies are the strongest engagement signal —
write to provoke a reply, not a like.

TITLE: null — Threads posts have no title slot.

METADATA TO RETURN:
  - topic_tags: 1-2 strings, no # prefix
  - char_count: integer char count of body
  - suggested_image_prompt: optional image prompt
  - cta_url: crazy4points URL (optional — native posts perform better)
`

export async function generateThreads(
  input: VariantGenInput,
): Promise<GeneratedVariant> {
  const systemPrompt = buildSystemPreamble(input) + FORMAT_RULES
  const userPrompt = `Write the Threads post variant. Title should be null.`
  return callSonnetForVariant({
    systemPrompt,
    userPrompt,
    caller: 'variant_threads',
    topicId: input.topic.id,
    format: FORMAT_NAME,
    maxTokens: 1024,
  })
}
