/**
 * Haiku-driven fact extractor for the content system rehaul (PR 2).
 *
 * Given a topic's `source_markdown` + `source_urls`, returns a structured
 * array of FactLedgerEntry objects. Every claim is paired with the EXACT
 * substring quote from source_markdown that supports it — the `verifyTopic`
 * server action then runs a programmatic substring check before the topic
 * can flip to fact_check_status='verified'.
 *
 * Anti-fabrication design:
 *   - System prompt requires EXACT substring quotes (no paraphrasing).
 *   - source_url must come from the editor-provided list (no invention).
 *   - Confidence='low' when the claim has no clean substring match.
 *
 * See plans/content-system-rehaul.md.
 */

import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'
import type { FactLedgerEntry, ConfidenceLevel } from '@/utils/supabase/queries'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are an editorial fact-extractor for a points-and-miles publication. Your job: read a piece of source markdown (typically an issuer's product page or press release) and extract every atomic factual claim.

For each claim you produce:
  - claim: a SINGLE factual statement, no opinions, no editorial framing, no marketing language ("amazing", "best", "exclusive")
  - category: optional. Pick ONE from: welcome_bonus | earn_rate | benefit | merchant | cap | deadline | eligibility | mechanic | fee | other
  - source_url: MUST be one of the URLs in the provided source_urls list. Don't invent URLs.
  - source_quote: the EXACT substring from source_markdown that supports this claim. Copy it character-for-character. A downstream substring check will reject the claim if your quote is not a literal substring of source_markdown.
  - confidence: 'high' if the quote directly states the claim; 'medium' if it requires light interpretation; 'low' if you couldn't find a clean substring match (use the closest available quote in that case)

CRITICAL RULES:
1. NEVER paraphrase the source_quote. Copy the exact text from source_markdown.
2. NEVER invent a source_url. Only use URLs from the source_urls list.
3. If source_markdown contains multiple URLs, choose the one whose content most directly supports the claim.
4. Each claim must be ONE statement — split compound claims into multiple entries.
5. Skip editorial framing, marketing fluff, calls-to-action, navigation labels, footer text.
6. Skip claims about competitors or third parties unless the source_markdown explicitly states them.
7. If the source_markdown is empty or contains no factual claims, return an empty array.

OUTPUT: call submit_fact_ledger with the structured entries.`

type ExtractInput = {
  topicId: string
  sourceMarkdown: string
  sourceUrls: string[]
}

export type ExtractFactLedgerResult =
  | { ok: true; entries: FactLedgerEntry[] }
  | { ok: false; error: string }

export async function extractFactLedger({
  topicId,
  sourceMarkdown,
  sourceUrls,
}: ExtractInput): Promise<ExtractFactLedgerResult> {
  if (!sourceMarkdown || !sourceMarkdown.trim()) {
    return { ok: false, error: 'source_markdown is empty — paste verified source content first.' }
  }
  if (!sourceUrls || sourceUrls.length === 0) {
    return { ok: false, error: 'source_urls is empty — at least one issuer-domain URL is required.' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not set' }

  const client = new Anthropic({ apiKey })

  const tool = {
    name: 'submit_fact_ledger',
    description: 'Submit the extracted fact ledger entries',
    input_schema: {
      type: 'object' as const,
      properties: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              claim: { type: 'string' },
              category: {
                anyOf: [
                  {
                    type: 'string',
                    enum: [
                      'welcome_bonus',
                      'earn_rate',
                      'benefit',
                      'merchant',
                      'cap',
                      'deadline',
                      'eligibility',
                      'mechanic',
                      'fee',
                      'other',
                    ],
                  },
                  { type: 'null' },
                ],
              },
              source_url: { type: 'string' },
              source_quote: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['claim', 'source_url', 'source_quote', 'confidence'],
          },
        },
      },
      required: ['entries'],
    },
  }

  const userPrompt = `Source URLs (pick one per claim):
${sourceUrls.map((u) => `- ${u}`).join('\n')}

Source markdown:
---
${sourceMarkdown}
---

Extract every atomic factual claim. Remember: source_quote MUST be an exact substring of the markdown above.`

  let response
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      tools: [tool],
      tool_choice: { type: 'tool', name: 'submit_fact_ledger' },
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Haiku error: ${message}` }
  }

  await logUsage(response, 'topic_fact_extraction', { topic_id: topicId })

  const toolUseBlock = response.content.find(
    (c): c is Extract<typeof c, { type: 'tool_use' }> => c.type === 'tool_use',
  )
  if (!toolUseBlock) {
    return { ok: false, error: 'Haiku did not call submit_fact_ledger' }
  }

  type RawEntry = {
    claim: string
    category?: string | null
    source_url: string
    source_quote: string
    confidence: ConfidenceLevel
  }
  const raw = (toolUseBlock.input ?? {}) as { entries?: RawEntry[] }
  const rawEntries = Array.isArray(raw.entries) ? raw.entries : []

  const now = new Date().toISOString()
  const entries: FactLedgerEntry[] = rawEntries.map((e) => ({
    claim: String(e.claim ?? ''),
    category: e.category ?? null,
    source_url: String(e.source_url ?? ''),
    source_quote: String(e.source_quote ?? ''),
    confidence: (e.confidence ?? 'low') as ConfidenceLevel,
    verified_at: now,
    verified_by: 'haiku',
  }))

  return { ok: true, entries }
}
