/**
 * Newsletter slot variant generator. 50-150 words; integrates with existing
 * 3-slot newsletter system (N1/N2/N3).
 */
import {
  buildSystemPreamble,
  callSonnetForVariant,
  type GeneratedVariant,
  type VariantGenInput,
} from './shared'

export const FORMAT_NAME = 'newsletter' as const
export const FORMAT_PROMPT_VERSION = 'v1-2026-05-18'

const FORMAT_RULES = `
FORMAT: NEWSLETTER SLOT (injected into weekly digest)

LENGTH: 50-150 words. F-pattern scannable — header, bullets, CTA.

STRUCTURE:
  1. Headline (5-10 words, action-oriented).
  2. 2-3 sentence summary — max. No walls of text.
  3. Optional bulleted "what you get" (3-5 bullets) for sweet-spot or
     multi-merchant topics.
  4. CTA copy — 2-4 words ("Read more", "See details", "Activate now").

METADATA TO RETURN:
  - subject_line: 40-70 chars. Front-load the hook. Mobile truncates at
    30-40 chars, so the first 30 chars MUST land.
  - preview_text: 35-55 chars. Completes the subject-line thought.
  - cta_text: 2-4 words
  - cta_url: /alerts/<slug> or /blog/<slug> (use the topic slug)
  - headline: 5-10 word action-oriented headline

BODY:
  - Markdown. \`## Headline\` then summary paragraph then optional bullets.
  - No hashtags, no emoji in headings.
`

export async function generateNewsletter(
  input: VariantGenInput,
): Promise<GeneratedVariant> {
  const systemPrompt = buildSystemPreamble(input) + FORMAT_RULES
  const userPrompt = `Write the newsletter slot variant. Title is required (use the headline).`
  return callSonnetForVariant({
    systemPrompt,
    userPrompt,
    caller: 'variant_newsletter',
    topicId: input.topic.id,
    format: FORMAT_NAME,
    maxTokens: 1024,
  })
}
