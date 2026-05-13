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
import type { CardExtraction } from '@/utils/cards/cardExtractionSchema'

const MODEL = 'claude-sonnet-4-6'

// Generous limit — Sapphire Reserve product page is ~25K chars of markdown.
// Sonnet handles up to 200K context; cost is what matters.
const MARKDOWN_CHAR_LIMIT = 40_000

// Separate limit for the Guide to Benefits PDF — they tend to be much longer
// (50K+ chars) and contain detailed insurance fine print. Cap higher because
// the GoB is the source of truth for coverage amounts.
const GOB_MARKDOWN_CHAR_LIMIT = 80_000

export type ExtractionResult =
  | { ok: true; extractionId: string; extraction: CardExtraction }
  | { ok: false; error: string }

export async function extractCardBenefits({
  cardId,
  cardName,
  sourceUrl,
  guideToBenefitsUrl,
  interactive = false,
}: {
  cardId: string
  cardName: string
  sourceUrl: string
  /**
   * Optional secondary source — issuer's Guide to Benefits PDF. When set,
   * Firecrawl scrapes the PDF (it auto-detects and returns clean markdown)
   * and the combined product-page + GoB markdown is passed to Sonnet.
   * Surfaces coverage amounts and fine print not on the marketing page.
   */
  guideToBenefitsUrl?: string | null
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

  // 1b. If a Guide to Benefits PDF is configured, scrape it in parallel.
  // Firecrawl auto-detects PDFs and returns markdown — no special endpoint
  // needed, just pass the PDF URL to /scrape. We don't block on failure —
  // GoB is supplemental, primary source is the product page.
  let gobMarkdown = ''
  if (guideToBenefitsUrl) {
    gobMarkdown = await fetchFirecrawl(guideToBenefitsUrl, {
      maxChars: GOB_MARKDOWN_CHAR_LIMIT,
      // PDFs sometimes take longer to parse than regular HTML pages
      timeoutMs: 60_000,
    })
    if (!gobMarkdown) {
      console.warn('[card-extract] Guide to Benefits PDF scrape returned empty:', guideToBenefitsUrl)
    }
  }
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

  // Build the user prompt — appends GoB PDF markdown as supplemental source
  // when present. Primary source remains the product page.
  const userPrompt = buildCardExtractionUserPrompt(
    cardName,
    sourceUrl,
    markdown,
    gobMarkdown ? { guideToBenefitsUrl, gobMarkdown } : undefined,
  )

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
          content: userPrompt,
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
      gob_markdown: gobMarkdown || null,
      gob_chars: gobMarkdown ? gobMarkdown.length : null,
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
      gob_markdown: gobMarkdown || null,
      gob_chars: gobMarkdown ? gobMarkdown.length : null,
      used_interactive: interactive,
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

  // If jsonrepair fired, append a warning so the editor knows the model's
  // raw output was slightly malformed and was auto-repaired.
  if (repaired) {
    extraction.extraction_warnings = [
      ...(extraction.extraction_warnings ?? []),
      'Claude JSON output required auto-repair (escaping fix). Spot-check source quotes for accuracy.',
    ]
  }

  // 4. Persist the extraction (status='extracted', not yet saved to card tables)
  const { data: inserted, error: insertErr } = await supabase
    .from('credit_card_extractions')
    .insert({
      card_id: cardId,
      source_url: sourceUrl,
      raw_markdown: markdown,
      markdown_chars: markdown.length,
      gob_markdown: gobMarkdown || null,
      gob_chars: gobMarkdown ? gobMarkdown.length : null,
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
