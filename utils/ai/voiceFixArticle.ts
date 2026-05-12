/**
 * Apply the voice-check failure notes back to the article body.
 *
 * Given the original description + the voice checker's specific fix
 * suggestions (in voice_notes), call Claude to apply those edits
 * surgically — without rewriting the whole article. Preserves all
 * factual content, structure, links, and bullets.
 *
 * Used by the "Quick fix" button on the alert edit page when the
 * brand-voice pill fails. Faster than re-running the full pipeline
 * because it skips writer + fact-check + originality.
 */

import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from './logUsage'
import { BRAND_VOICE } from './editorialRules'

function extractJson(text: string): string {
  // Same pattern as voiceCheckArticle.ts — strip fence-wrappers if present.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return fence ? fence[1].trim() : text.trim()
}

const SYSTEM_PROMPT = `You apply surgical voice edits to a points-and-miles article body
based on specific feedback from a brand-voice checker.

BRAND VOICE (must align with):
${BRAND_VOICE}

RULES FOR EDITS:
- Apply ONLY the specific changes the feedback calls out.
- Do NOT rewrite the article. Do NOT change structure, bullets, lists, or links.
- Do NOT add or remove facts. Preserve every number, date, program name,
  and link as-is.
- If feedback says "vague hedging — name the actual value", replace the
  hedge with the concrete number that's already in the article.
- If feedback says "trim to one playful aside max", remove ONE of the
  flagged playful phrases — pick the weaker one — and leave the other.
- Output the FULL revised article body, with only the targeted changes
  applied. Markdown preserved exactly.

Output format: JSON with one key:
{
  "article_body": "<full revised body with edits applied>"
}`

export interface VoiceFixArgs {
  title: string
  article_body: string
  voice_notes: string
}

export async function voiceFixArticle(args: VoiceFixArgs): Promise<{ article_body: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[voiceFixArticle] ANTHROPIC_API_KEY missing')
    return null
  }

  const userContent = JSON.stringify(
    {
      title: args.title,
      voice_check_feedback: args.voice_notes,
      article_body: args.article_body,
    },
    null,
    2,
  )

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    await logUsage(message, 'voiceFixArticle')
    const block = message.content[0]
    if (!block || block.type !== 'text') return null
    const parsed = JSON.parse(extractJson(block.text)) as { article_body?: unknown }
    if (typeof parsed.article_body !== 'string' || !parsed.article_body.trim()) return null
    return { article_body: parsed.article_body.trim() }
  } catch (err) {
    console.error('[voiceFixArticle] Sonnet call failed:', err)
    return null
  }
}
