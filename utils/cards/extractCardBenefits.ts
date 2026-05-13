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
import { jsonrepair } from 'jsonrepair'
import { fetchFirecrawl, fetchFirecrawlInteractive } from '@/utils/ai/firecrawl'
import { logUsage } from '@/utils/ai/logUsage'
import { createAdminClient } from '@/utils/supabase/server'
import {
  CARD_EXTRACTION_SYSTEM_PROMPT,
  buildCardExtractionUserPrompt,
} from '@/utils/cards/cardExtractionPrompt'
import { reviewExtraction } from '@/utils/cards/reviewExtraction'
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
  interactive = false,
}: {
  cardId: string
  cardName: string
  sourceUrl: string
  /**
   * When true, runs Firecrawl with EXPAND_EVERYTHING_ACTIONS — opens all
   * <details>, clicks Show more/View all/Expand buttons, toggles aria-expanded
   * elements before extracting markdown. Use for JS-heavy issuer pages
   * (Citi, US Bank, Wells Fargo) where benefits hide behind accordions.
   * Adds ~5-10s to extraction time and ~$0.002 in Firecrawl cost.
   */
  interactive?: boolean
}): Promise<ExtractionResult> {
  const supabase = createAdminClient()

  // 1. Firecrawl → markdown (optionally interactive)
  const markdown = interactive
    ? await fetchFirecrawlInteractive(sourceUrl, { maxChars: MARKDOWN_CHAR_LIMIT })
    : await fetchFirecrawl(sourceUrl, { maxChars: MARKDOWN_CHAR_LIMIT })
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
      used_interactive: interactive,
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
  let repaired = false
  try {
    // Strip code fences in case the model wraps anyway despite the instruction.
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

    // Prose detection: if the response doesn't start with `{`, Sonnet bailed
    // and wrote prose instead of JSON. Usually means the page Firecrawl
    // returned wasn't the product page (interactive mode navigation, redirect,
    // wrong URL, blocked content). Surface a clear error rather than a
    // confusing "Unexpected character" JSON parser error.
    if (!cleaned.startsWith('{')) {
      const proseSnippet = cleaned.slice(0, 220).replace(/\n/g, ' ')
      throw new Error(
        `Claude returned prose, not JSON. Often means the scraped page wasn't the card product page. ` +
        `${interactive ? 'Try disabling Interactive mode — it may have navigated the browser away from the product page. ' : ''}` +
        `Claude said: "${proseSnippet}..."`,
      )
    }

    try {
      extraction = JSON.parse(cleaned) as CardExtraction
    } catch {
      // Sonnet sometimes returns JSON with unescaped quotes inside long
      // source_quote strings, or trailing commas. jsonrepair is a small
      // library that fixes the most common LLM-output JSON quirks without
      // hallucinating new structure. Last-resort fallback before failing.
      console.warn('[card-extract] strict JSON.parse failed, trying jsonrepair')
      extraction = JSON.parse(jsonrepair(cleaned)) as CardExtraction
      repaired = true
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stopReason = response.stop_reason
    const truncated = stopReason === 'max_tokens'
    await supabase.from('credit_card_extractions').insert({
      card_id: cardId,
      source_url: sourceUrl,
      raw_markdown: markdown,
      markdown_chars: markdown.length,
      used_interactive: interactive,
      extraction: { raw: rawText, stop_reason: stopReason },
      model: MODEL,
      input_tokens: response.usage?.input_tokens ?? null,
      output_tokens: response.usage?.output_tokens ?? null,
      status: 'failed',
      error_message: truncated
        ? `Claude hit max_tokens cap (output truncated). Increase max_tokens above ${response.usage?.output_tokens ?? '?'}.`
        : message,
    })
    return {
      ok: false,
      error: truncated
        ? 'Claude ran out of output tokens before finishing the JSON. The max_tokens limit needs to be raised.'
        : message,
    }
  }

  // If jsonrepair fired, append a warning so the editor knows the model's
  // raw output was slightly malformed and was auto-repaired.
  if (repaired) {
    extraction.extraction_warnings = [
      ...(extraction.extraction_warnings ?? []),
      'Claude JSON output required auto-repair (escaping fix). Spot-check source quotes for accuracy.',
    ]
  }

  // 3b. Review pass — second Sonnet call that re-reads the markdown and looks
  // for anything pass 1 missed. Conservative; only adds, never modifies.
  // Failures are non-fatal — pass 1's output is used as-is if review errors.
  const review = await reviewExtraction({
    cardName,
    markdown,
    cardId,
    extraction,
  })
  if (review.ran) {
    console.log(
      `[card-extract] review pass added ${review.addedBenefits} benefits + ` +
      `${review.addedEarnRates} earn rates (input=${review.inputTokens}, output=${review.outputTokens})`,
    )
  }
  // Use the merged extraction going forward.
  extraction = review.extraction

  // 4. Persist the extraction (status='extracted', not yet saved to card tables)
  const { data: inserted, error: insertErr } = await supabase
    .from('credit_card_extractions')
    .insert({
      card_id: cardId,
      source_url: sourceUrl,
      raw_markdown: markdown,
      markdown_chars: markdown.length,
      used_interactive: interactive,
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
