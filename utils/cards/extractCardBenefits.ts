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
import { createHash } from 'node:crypto'
import { fetchFirecrawl, fetchFirecrawlInteractive } from '@/utils/ai/firecrawl'
import { logUsage } from '@/utils/ai/logUsage'
import { createAdminClient } from '@/utils/supabase/server'
import {
  CARD_EXTRACTION_SYSTEM_PROMPT,
  buildCardExtractionUserPrompt,
} from '@/utils/cards/cardExtractionPrompt'
import { reviewExtraction } from '@/utils/cards/reviewExtraction'
import type { CardExtraction } from '@/utils/cards/cardExtractionSchema'
import { verifyCardExtraction } from '@/utils/cards/verifyCardExtraction'

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
  manualMarkdown,
  secondaryUrls,
  skipIfUnchanged = false,
}: {
  cardId: string
  cardName: string
  sourceUrl: string
  interactive?: boolean
  manualMarkdown?: string
  /**
   * Optional additional URLs to scrape alongside sourceUrl. Their markdown
   * is concatenated (with === SOURCE N: <url> === separators) and sent to
   * Sonnet as one combined input. Use for the Guide to Benefits page which
   * holds insurance/protection details missing from the main product page.
   */
  secondaryUrls?: string[]
  /**
   * Cost-reduction: when true, compute a SHA-256 of the scraped markdown
   * and compare to the last 'saved' extraction's hash. If identical, skip
   * the Sonnet extraction + verification calls entirely (just bump
   * last_verified). Auto-refresh cron sets this. Manual extractions
   * default to false so the editor always gets a fresh Sonnet pass.
   */
  skipIfUnchanged?: boolean
}): Promise<ExtractionResult> {
  const supabase = createAdminClient()

  // 1. Markdown — manual paste OR Firecrawl scrape of source + secondary URLs.
  const hasManualPaste = manualMarkdown && manualMarkdown.trim().length > 100
  const PER_URL_LIMIT = Math.floor(MARKDOWN_CHAR_LIMIT / Math.max(1, 1 + (secondaryUrls?.length ?? 0)))

  async function scrapeOne(url: string): Promise<string> {
    const result = interactive
      ? await fetchFirecrawlInteractive(url, { maxChars: PER_URL_LIMIT })
      : await fetchFirecrawl(url, { maxChars: PER_URL_LIMIT })
    // Card extraction has no use for the granular failure reason; treat any
    // !ok the same as the old empty-string return.
    return result.ok ? result.markdown : ''
  }

  let markdown: string
  if (hasManualPaste) {
    markdown = manualMarkdown!.slice(0, MARKDOWN_CHAR_LIMIT)
    console.log(`[card-extract] using manual paste (${manualMarkdown!.length} chars), skipping Firecrawl`)
  } else {
    const allUrls = [sourceUrl, ...(secondaryUrls ?? [])].filter((u) => u && u.trim())
    const scrapes = await Promise.all(allUrls.map(scrapeOne))
    const labeled = scrapes
      .map((md, i) => (md ? `=== SOURCE ${i + 1}: ${allUrls[i]} ===\n\n${md}` : null))
      .filter((s): s is string => s !== null)
    markdown = labeled.join('\n\n').slice(0, MARKDOWN_CHAR_LIMIT)
    if (allUrls.length > 1) {
      console.log(`[card-extract] combined ${labeled.length}/${allUrls.length} URLs into ${markdown.length} chars`)
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

  // Content fingerprint — skip Sonnet entirely if markdown hasn't changed
  // since the last extraction. Saves ~$0.30 per refresh when nothing changed.
  // Manual extractions always run because the editor explicitly clicked.
  const markdownHash = createHash('sha256').update(markdown).digest('hex')
  if (skipIfUnchanged) {
    const { data: lastSavedExt } = await supabase
      .from('credit_card_extractions')
      .select('id, markdown_hash, extraction')
      .eq('card_id', cardId)
      .eq('status', 'saved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lastSavedExt?.markdown_hash === markdownHash) {
      // No-op insert so the audit log shows a refresh attempt with reason
      const { data: skipRow } = await supabase
        .from('credit_card_extractions')
        .insert({
          card_id: cardId,
          source_url: sourceUrl,
          raw_markdown: markdown,
          markdown_chars: markdown.length,
          markdown_hash: markdownHash,
          used_interactive: interactive,
          extraction: lastSavedExt.extraction ?? {},
          model: MODEL,
          status: 'skipped_unchanged',
          error_message: null,
        })
        .select('id')
        .single()
      // Bump last_verified on the card so refresh-queue treats it as fresh
      await supabase
        .from('credit_cards')
        .update({ last_verified: new Date().toISOString().slice(0, 10) })
        .eq('id', cardId)
      console.log(`[card-extract] ${cardName} markdown unchanged (sha=${markdownHash.slice(0, 8)}) — skipped Sonnet`)
      return { ok: true, extractionId: skipRow?.id ?? '', extraction: lastSavedExt.extraction as CardExtraction }
    }
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
      // Prompt caching: system prompt is stable across extractions; cache it.
      // User-message markdown is cached too so the immediately-following
      // verification call (verifyCardExtraction) reads from the same cache
      // within the 5-minute ephemeral TTL — drops verify input cost ~10x.
      system: [
        {
          type: 'text',
          text: CARD_EXTRACTION_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildCardExtractionUserPrompt(cardName, sourceUrl, markdown),
              cache_control: { type: 'ephemeral' },
            },
          ],
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
      markdown_hash: markdownHash,
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

  // ── Auto-verify: reconcile extracted JSON against the raw markdown ──
  // Fires immediately after extraction so the admin review UI lands with
  // per-field verdicts populated. Errors are swallowed (verifyCardExtraction
  // persists its own error verdict) so a verify failure never blocks the
  // extraction itself from being saved.
  try {
    const verifyResult = await verifyCardExtraction({
      cardId,
      cardName,
      extraction,
      markdown,
      extractionId: inserted.id,
    })
    if (verifyResult.ok) {
      console.log(`[card-extract] verify ${verifyResult.verdict}: ${verifyResult.field_verdicts.length} field verdicts`)
    } else {
      console.error(`[card-extract] verify failed: ${verifyResult.error}`)
    }
  } catch (err) {
    console.error('[card-extract] verifyCardExtraction threw:', err)
  }

  return { ok: true, extractionId: inserted.id, extraction }
}
