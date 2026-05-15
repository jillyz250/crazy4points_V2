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
  interactive = false,
}: {
  programId: string
  programName: string
  programSlug: string
  programType: string
  sourceUrl: string
  interactive?: boolean
}): Promise<ProgramExtractionResult> {
  const supabase = createAdminClient()

  const markdown = interactive
    ? await fetchFirecrawlInteractive(sourceUrl, { maxChars: MARKDOWN_CHAR_LIMIT })
    : await fetchFirecrawl(sourceUrl, { maxChars: MARKDOWN_CHAR_LIMIT })

  if (!markdown) {
    await supabase.from('program_extractions').insert({
      program_id: programId,
      source_url: sourceUrl,
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
        content: buildProgramExtractionUserPrompt(programName, programSlug, programType, sourceUrl, markdown),
      }],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase.from('program_extractions').insert({
      program_id: programId,
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

  await logUsage(response, 'extract_program_content', { program_id: programId, source_url: sourceUrl })

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
      source_url: sourceUrl,
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
