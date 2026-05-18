/**
 * Shared scaffold for the 8 variant generators.
 *
 * Each generator (alert/blog/newsletter/facebook/twitter/instagram/linkedin/
 * threads) imports `callSonnetForVariant` and passes a format-specific system
 * prompt + Anthropic tool schema. The shared call handles:
 *   - API key check
 *   - Model + token budget defaults
 *   - logUsage call
 *   - Tool-use parsing
 *
 * See plans/content-system-rehaul.md.
 */

import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'
import { BRAND_VOICE } from '@/utils/ai/editorialRules'
import type { Topic, FactLedgerEntry } from '@/utils/supabase/queries'

export const SONNET_MODEL = 'claude-sonnet-4-6'
export const DEFAULT_MAX_TOKENS = 4096

export type GeneratedVariant = {
  title: string | null
  body: string
  metadata: Record<string, unknown>
}

export type VariantGenInput = {
  topic: Topic
  factLedger: FactLedgerEntry[]
  brandVoice: string
}

/**
 * Build the universal preamble injected at the top of every format-specific
 * system prompt. The fact ledger + source markdown are the ONLY allowed
 * sources of fact. The format prompt that follows adds the structure /
 * length / hashtag rules.
 */
export function buildSystemPreamble(input: VariantGenInput): string {
  const { topic, factLedger, brandVoice } = input

  const ledgerLines = factLedger.map((entry, i) => {
    const cat = entry.category ? ` [${entry.category}]` : ''
    const conf = `(${entry.confidence})`
    return `${i + 1}.${cat} ${conf} ${entry.claim}
   source: ${entry.source_url}
   quote: "${entry.source_quote}"`
  })

  const programs = topic.programs.length ? topic.programs.join(', ') : '(none)'
  const cards = topic.cards.length ? topic.cards.join(', ') : '(none)'

  return `You are a writer for crazy4points, a points-and-miles publication.

TOPIC
  Title: ${topic.title}
  Summary: ${topic.summary ?? '(no summary)'}
  Programs: ${programs}
  Cards: ${cards}
  Topic type: ${topic.topic_type}
  End date: ${topic.end_date ? topic.end_date.slice(0, 10) : '(no end date)'}

FACT LEDGER (the ONLY facts you may use)
${ledgerLines.length > 0 ? ledgerLines.join('\n') : '(empty — refuse to draft)'}

SOURCE MARKDOWN (for tone/context only — not for new facts)
---
${topic.source_markdown ?? '(no source markdown attached)'}
---

BRAND VOICE
${brandVoice}

UNIVERSAL RULES (apply to every format)
1. Use ONLY facts from the fact ledger above. Do NOT introduce facts from
   training data. If a fact you'd like to mention is not in the ledger,
   OMIT it. The system runs a programmatic fact-grep after you respond —
   dollar amounts, percentages, and dates that aren't in the ledger get
   flagged for editor review.
2. Do NOT cite third-party blogs ("according to The Points Guy", "per
   NerdWallet"). The Points Guy / NerdWallet / Doctor of Credit / Upgraded
   Points / OMAAT / Frequent Miler are NEVER acceptable sources.
3. Do NOT include engagement bait ("Comment below!", "Tag a friend!",
   "Smash that like button"). Platforms penalize it.
4. Honor topic.title and topic.summary as starting context — the variant
   doesn't have to use them verbatim, but it should be unmistakably about
   the same topic.
5. Apply the brand voice above. Sassy, funny, smart — never mean, never
   smug, never clickbait.
`
}

/**
 * Anthropic tool schema for the standard variant-submission shape.
 * Title is nullable (FB/Twitter/IG/Threads omit it).
 */
export const SUBMIT_VARIANT_TOOL = {
  name: 'submit_variant',
  description: 'Submit the generated variant.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      body: { type: 'string' },
      metadata: { type: 'object' },
    },
    required: ['body'],
  },
}

export type CallSonnetInput = {
  systemPrompt: string
  userPrompt: string
  caller: string
  topicId: string
  format: string
  maxTokens?: number
}

export async function callSonnetForVariant({
  systemPrompt,
  userPrompt,
  caller,
  topicId,
  format,
  maxTokens = DEFAULT_MAX_TOKENS,
}: CallSonnetInput): Promise<GeneratedVariant> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: SONNET_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    tools: [SUBMIT_VARIANT_TOOL],
    tool_choice: { type: 'tool', name: 'submit_variant' },
    messages: [{ role: 'user', content: userPrompt }],
  })

  await logUsage(response, caller, { topic_id: topicId, format })

  const toolUseBlock = response.content.find(
    (c): c is Extract<typeof c, { type: 'tool_use' }> => c.type === 'tool_use',
  )
  if (!toolUseBlock) {
    throw new Error('Sonnet did not call submit_variant')
  }

  const raw = (toolUseBlock.input ?? {}) as {
    title?: string | null
    body?: string
    metadata?: Record<string, unknown>
  }

  return {
    title: raw.title ?? null,
    body: String(raw.body ?? ''),
    metadata: raw.metadata ?? {},
  }
}

export { BRAND_VOICE }
