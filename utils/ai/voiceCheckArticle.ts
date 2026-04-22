/**
 * Brand-voice check for a drafted article body. Scores against BRAND_VOICE
 * rules and returns pass/fail + short editor-facing notes.
 */
import Anthropic from '@anthropic-ai/sdk'
import { BRAND_VOICE } from './editorialRules'

export interface VoiceCheckResult {
  pass: boolean
  notes: string
  checked_at: string
}

const SYSTEM_PROMPT = `You are the voice editor for crazy4points. Evaluate a drafted article
body against the brand voice rules below. Return a concise verdict — you are not rewriting.

═══════════════════════════════════════════════════════════
BRAND VOICE
═══════════════════════════════════════════════════════════
${BRAND_VOICE}

═══════════════════════════════════════════════════════════
HOW TO JUDGE
═══════════════════════════════════════════════════════════

pass = true when the body clearly lands in voice:
• Leads with reader payoff, not recap
• Uses concrete numbers + named dates
• Contractions, short sentences, confident
• Zero (or at most one) playful aside — never stacked winks
• No corporate hedging, no off-limits phrases, no clickbait

pass = false when any of these are true:
• Reads like a press release or news recap
• Uses off-limits phrases ("savvy travelers", "hack", "game-changer", "must-know", "insider")
• Stacks multiple winks/jokes or ALL CAPS for emphasis
• Vague calls to action ("worth a look", "act fast") instead of named deadlines
• Mean, preachy, or smug about travelers/brands/programs

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Return a single JSON object. No prose, no markdown fences.

{
  "pass": true | false,
  "notes": "<under 240 chars — if pass, one sentence on strengths; if fail, the top 1–2 specific issues an editor should fix>"
}`

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

export async function voiceCheckArticle(args: {
  title: string
  article_body: string
}): Promise<VoiceCheckResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[voiceCheckArticle] ANTHROPIC_API_KEY missing — skipping')
    return null
  }

  const userContent = JSON.stringify({ title: args.title, article_body: args.article_body }, null, 2)

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    const block = message.content[0]
    if (!block || block.type !== 'text') return null
    const parsed = JSON.parse(extractJson(block.text)) as { pass?: unknown; notes?: unknown }
    return {
      pass: parsed.pass === true,
      notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 400) : '',
      checked_at: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[voiceCheckArticle] Sonnet call failed:', err)
    return null
  }
}
