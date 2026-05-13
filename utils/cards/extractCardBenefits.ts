/**
 * Card benefits extraction pipeline.
 *
 *   1. Firecrawl scrape → markdown (cached after first run)
 *   2. Claude Sonnet extraction → structured JSON
 *   3. Persist both to credit_card_extractions for audit + replay
 *
 * Returns the extraction row id so the caller can fetch and render the
 * structured output in the admin review screen.
 */

import Anthropic from '@anthropic-ai/sdk'
import { fetchFirecrawl } from '@/utils/ai/firecrawl'
import { logUsage } from '@/utils/ai/logUsage'
import { createAdminClient } from '@/utils/supabase/server'
import {
  CARD_EXTRACTION_SYSTEM_PROMPT,
  buildCardExtractionUserPrompt,
} from '@/utils/cards/cardExtractionPrompt'
import type { CardExtraction } from '@/utils/cards/cardExtractionSchema'

const MODEL = 'claude-sonnet-4-6'

// Generous limit — Sapphire Reserve product page is ~25K chars of markdown.
// Sonnet handles up to 200K context; cost is what matters.
const MARKDOWN_CHAR_LIMIT = 40_000

export type ExtractionResult =
  | { ok: true; extractionId: string; extraction: CardExtraction }
  | { ok: false; error: string }

export async function extractCardBenefits({
  cardId,
  cardName,
  sourceUrl,
}: {
  cardId: string
  cardName: string
  sourceUrl: string
}): Promise<ExtractionResult> {
  const supabase = createAdminClient()

  // 1. Firecrawl → markdown
  const markdown = await fetchFirecrawl(sourceUrl, MARKDOWN_CHAR_LIMIT)
  if (!markdown) {
    await supabase.from('credit_card_extractions').insert({
      card_id: cardId,
      source_url: sourceUrl,
      raw_markdown: null,
      markdown_chars: 0,
      extraction: {},
      model: MODEL,
      status: 'failed',
      error_message: 'Firecrawl returned empty markdown',
    })
    return { ok: false, error: 'Firecrawl returned no markdown for this URL' }
  }

  // 2. Claude Sonnet → structured JSON
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not set' }

  const client = new Anthropic({ apiKey })

  let response
  try {
    response = await client.messages.create({
      model: MODEL,
      // Sapphire Reserve has 15+ benefits × ~200 char source_quotes each plus
      // earn rates + welcome bonus + top-level fields. 16K headroom keeps
      // benefit-rich cards from truncating mid-JSON. Sonnet supports up to 64K.
      max_tokens: 16000,
      system: CARD_EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildCardExtractionUserPrompt(cardName, sourceUrl, markdown),
        },
      ],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase.from('credit_card_extractions').insert({
      card_id: cardId,
      source_url: sourceUrl,
      raw_markdown: markdown,
      markdown_chars: markdown.length,
      extraction: {},
      model: MODEL,
      status: 'failed',
      error_message: `Anthropic error: ${message}`,
    })
    return { ok: false, error: `Claude error: ${message}` }
  }

  // Log usage + cost
  await logUsage(response, 'extract_card_benefits', { card_id: cardId, source_url: sourceUrl })

  // 3. Parse JSON response
  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return { ok: false, error: 'Claude returned no text content' }
  }
  const rawText = textBlock.text.trim()

  let extraction: CardExtraction
  try {
    // Strip code fences in case the model wraps anyway despite the instruction.
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    extraction = JSON.parse(cleaned) as CardExtraction
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stopReason = response.stop_reason
    const truncated = stopReason === 'max_tokens'
    await supabase.from('credit_card_extractions').insert({
      card_id: cardId,
      source_url: sourceUrl,
      raw_markdown: markdown,
      markdown_chars: markdown.length,
      extraction: { raw: rawText, stop_reason: stopReason },
      model: MODEL,
      input_tokens: response.usage?.input_tokens ?? null,
      output_tokens: response.usage?.output_tokens ?? null,
      status: 'failed',
      error_message: truncated
        ? `Claude hit max_tokens cap (output truncated). Increase max_tokens above ${response.usage?.output_tokens ?? '?'}.`
        : `JSON parse failed: ${message}`,
    })
    return {
      ok: false,
      error: truncated
        ? 'Claude ran out of output tokens before finishing the JSON. The max_tokens limit needs to be raised.'
        : `Claude returned invalid JSON: ${message}`,
    }
  }

  // 4. Persist the extraction (status='extracted', not yet saved to card tables)
  const { data: inserted, error: insertErr } = await supabase
    .from('credit_card_extractions')
    .insert({
      card_id: cardId,
      source_url: sourceUrl,
      raw_markdown: markdown,
      markdown_chars: markdown.length,
      extraction,
      model: MODEL,
      input_tokens: response.usage?.input_tokens ?? null,
      output_tokens: response.usage?.output_tokens ?? null,
      status: 'extracted',
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    return { ok: false, error: `DB insert failed: ${insertErr?.message ?? 'unknown'}` }
  }

  return { ok: true, extractionId: inserted.id, extraction }
}
