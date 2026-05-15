/**
 * Program extraction pipeline.
 *
 *   1. Firecrawl scrape → markdown
 *   2. Claude Sonnet pass 1 → structured ProgramExtraction JSON
 *   3. Sonnet pass 2 (review) → finds anything pass 1 missed
 *   4. Merge + persist to program_extractions (status='extracted')
 *
 * Returns the extraction row id so the admin review screen can render the
 * diff against current programs.<field> values.
 *
 * NO direct writes to programs.* — that's per-field, editor-driven, via
 * the apply action.
 */

import Anthropic from '@anthropic-ai/sdk'
import { jsonrepair } from 'jsonrepair'
import { fetchFirecrawl, fetchFirecrawlInteractive } from '@/utils/ai/firecrawl'
import { logUsage } from '@/utils/ai/logUsage'
import { createAdminClient } from '@/utils/supabase/server'
import {
  PROGRAM_EXTRACTION_SYSTEM_PROMPT,
  buildProgramExtractionUserPrompt,
} from '@/utils/programs/programExtractionPrompt'
import { reviewProgramExtraction } from '@/utils/programs/reviewProgramExtraction'
import { verifySourceUrl } from '@/utils/programs/verifySourceUrl'
import type { ProgramExtraction } from '@/utils/programs/programExtractionSchema'

const MODEL = 'claude-sonnet-4-6'
const MARKDOWN_CHAR_LIMIT = 60_000  // Program pages tend longer than card pages

export type ProgramExtractionResult =
  | { ok: true; extractionId: string; extraction: ProgramExtraction }
  | { ok: false; error: string }

export async function extractProgramContent({
  programId,
  programName,
  programSlug,
  programType,
  sourceUrl,
  additionalUrls = [],
  interactive = false,
}: {
  programId: string
  programName: string
  programSlug: string
  programType: string
  sourceUrl: string
  /**
   * Optional supplemental URLs. All scraped in parallel and concatenated
   * with section headers before being passed to Sonnet. Useful for alliances
   * and large programs that split content across pages.
   * Each adds ~1 Firecrawl credit (~$0.001) and ~$0.06 in Sonnet input tokens.
   */
  additionalUrls?: string[]
  interactive?: boolean
}): Promise<ProgramExtractionResult> {
  const supabase = createAdminClient()

  // Pre-flight: verify all URLs are live before spending Firecrawl + Sonnet credits.
  const verify = await verifySourceUrl(sourceUrl)
  if (!verify.ok) {
    await supabase.from('program_extractions').insert({
      program_id: programId,
      source_url: sourceUrl,
      raw_markdown: null,
      markdown_chars: 0,
      used_interactive: interactive,
      extraction: {},
      model: MODEL,
      status: 'failed',
      error_message: `URL pre-flight failed: ${verify.error}`,
    })
    return { ok: false, error: verify.error }
  }

  let finalUrl = verify.finalUrl
  if (verify.redirected) {
    console.log(`[program-extract] URL redirected: ${sourceUrl} -> ${finalUrl}`)
    await supabase
      .from('programs')
      .update({ extraction_source_url: finalUrl })
      .eq('id', programId)
  }

  // Verify additional URLs in parallel (non-blocking on failure — invalid
  // supplemental URLs are skipped with a warning, primary URL still proceeds).
  const verifiedAdditional: string[] = []
  if (additionalUrls.length > 0) {
    const verifications = await Promise.all(
      additionalUrls.filter((u) => u && u.trim()).map(async (u) => ({ url: u, result: await verifySourceUrl(u) })),
    )
    for (const v of verifications) {
      if (v.result.ok) {
        verifiedAdditional.push(v.result.finalUrl)
      } else {
        console.warn(`[program-extract] supplemental URL skipped: ${v.url} - ${v.result.error}`)
      }
    }
  }

  // Scrape primary + all supplemental URLs in parallel. Each gets up to
  // 1/N of the markdown budget so the combined output fits within Sonnet's
  // input context comfortably.
  const allUrls = [finalUrl, ...verifiedAdditional]
  const perUrlLimit = Math.floor(MARKDOWN_CHAR_LIMIT / Math.max(allUrls.length, 1))

  const scrapes = await Promise.all(
    allUrls.map(async (url) => {
      const md = interactive
        ? await fetchFirecrawlInteractive(url, { maxChars: perUrlLimit })
        : await fetchFirecrawl(url, { maxChars: perUrlLimit })
      return { url, markdown: md }
    }),
  )

  // Concatenate with section headers so Sonnet knows which source each
  // segment came from.
  const validScrapes = scrapes.filter((s) => s.markdown && s.markdown.length > 0)
  const markdown = validScrapes
    .map((s, i) => `=== SOURCE ${i + 1}: ${s.url} ===\n\n${s.markdown}`)
    .join('\n\n')

  if (!markdown) {
    await supabase.from('program_extractions').insert({
      program_id: programId,
      source_url: finalUrl,
      raw_markdown: null,
      markdown_chars: 0,
      used_interactive: interactive,
      extraction: {},
      model: MODEL,
      status: 'failed',
      error_message: 'Firecrawl returned empty markdown',
    })
    return { ok: false, error: 'Firecrawl returned no markdown for this URL' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not set' }

  const client = new Anthropic({ apiKey })

  let response
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: PROGRAM_EXTRACTION_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildProgramExtractionUserPrompt(programName, programSlug, programType, finalUrl, markdown),
      }],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase.from('program_extractions').insert({
      program_id: programId,
      source_url: finalUrl,
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

  await logUsage(response, 'extract_program_content', { program_id: programId, source_url: finalUrl })

  const textBlock = response.content.find((c) => c.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return { ok: false, error: 'Claude returned no text content' }
  }
  const rawText = textBlock.text.trim()

  let extraction: ProgramExtraction
  let repaired = false
  try {
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

    if (!cleaned.startsWith('{')) {
      const proseSnippet = cleaned.slice(0, 220).replace(/\n/g, ' ')
      throw new Error(
        `Claude returned prose, not JSON. Page may not be a program landing page. ` +
        `${interactive ? 'Try disabling Interactive mode. ' : ''}` +
        `Claude said: "${proseSnippet}..."`,
      )
    }

    try {
      extraction = JSON.parse(cleaned) as ProgramExtraction
    } catch {
      extraction = JSON.parse(jsonrepair(cleaned)) as ProgramExtraction
      repaired = true
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stopReason = response.stop_reason
    const truncated = stopReason === 'max_tokens'
    await supabase.from('program_extractions').insert({
      program_id: programId,
      source_url: finalUrl,
      raw_markdown: markdown,
      markdown_chars: markdown.length,
      used_interactive: interactive,
      extraction: { raw: rawText, stop_reason: stopReason },
      model: MODEL,
      input_tokens: response.usage?.input_tokens ?? null,
      output_tokens: response.usage?.output_tokens ?? null,
      status: 'failed',
      error_message: truncated
        ? `Claude hit max_tokens cap. Increase above ${response.usage?.output_tokens ?? '?'}.`
        : message,
    })
    return { ok: false, error: message }
  }

  if (repaired) {
    extraction.extraction_warnings = [
      ...(extraction.extraction_warnings ?? []),
      'Claude JSON output required auto-repair. Spot-check source quotes.',
    ]
  }

  // Two-pass review — Sonnet re-reads to catch missed fields
  const review = await reviewProgramExtraction({
    programName,
    markdown,
    programId,
    extraction,
  })
  if (review.ran) {
    console.log(`[program-extract] review pass added ${review.addedFields} fields`)
  }
  extraction = review.extraction

  const { data: inserted, error: insertErr } = await supabase
    .from('program_extractions')
    .insert({
      program_id: programId,
      source_url: finalUrl,
      raw_markdown: markdown,
      markdown_chars: markdown.length,
      used_interactive: interactive,
      extraction,
      model: MODEL,
      input_tokens: response.usage?.input_tokens ?? null,
      output_tokens: response.usage?.output_tokens ?? null,
      review_pass_ran: review.ran,
      review_pass_added_count: review.addedFields,
      status: 'extracted',
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    return { ok: false, error: `DB insert failed: ${insertErr?.message ?? 'unknown'}` }
  }

  return { ok: true, extractionId: inserted.id, extraction }
}
