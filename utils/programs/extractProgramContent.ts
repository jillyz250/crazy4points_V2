/**
 * Program extraction pipeline — per-field source URL mode.
 *
 *   1. Read field_source_urls from programs row
 *   2. Group fields by URL (so each unique URL is scraped exactly once)
 *   3. For each group: Firecrawl scrape + focused Sonnet call extracting
 *      ONLY the fields mapped to that URL
 *   4. Merge all per-URL extractions into a single ProgramExtraction
 *   5. Run review pass on the merged result
 *   6. Persist to program_extractions (status='extracted')
 *
 * NO direct writes to programs.* — that's per-field, editor-driven, via
 * the apply action.
 *
 * Legacy fallback: when field_source_urls is empty {} but extraction_source_url
 * is set, use the old "scrape one page, extract everything" mode.
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
const PER_URL_MARKDOWN_LIMIT = 40_000

export type ProgramExtractableField =
  | 'intro'
  | 'sweet_spots'
  | 'lounge_access'
  | 'quirks'
  | 'award_chart'
  | 'tier_benefits'
  | 'alliance'
  | 'hubs'
  | 'parent_program_slug'

export const ALL_EXTRACTABLE_FIELDS: ProgramExtractableField[] = [
  'intro',
  'sweet_spots',
  'lounge_access',
  'quirks',
  'award_chart',
  'tier_benefits',
  'alliance',
  'hubs',
  'parent_program_slug',
]

export type FieldSourceUrls = Partial<Record<ProgramExtractableField, string | null>>

export type ProgramExtractionResult =
  | { ok: true; extractionId: string; extraction: ProgramExtraction }
  | { ok: false; error: string }

/**
 * Empty ProgramExtraction template — every field nulled with low confidence.
 * Per-URL extractions overwrite the fields they're responsible for.
 */
function emptyExtraction(): ProgramExtraction {
  const nullField = { value: null, source_quote: null, confidence: 'low' as const }
  return {
    intro: nullField,
    sweet_spots: nullField,
    lounge_access: nullField,
    quirks: nullField,
    award_chart: nullField,
    tier_benefits: { rows: [], source_quote: null, confidence: 'low' },
    alliance: nullField,
    hubs: nullField,
    parent_program_slug: nullField,
    extraction_warnings: [],
  }
}

export async function extractProgramContent({
  programId,
  programName,
  programSlug,
  programType,
  fieldSourceUrls,
  legacySourceUrl,
  interactive = false,
}: {
  programId: string
  programName: string
  programSlug: string
  programType: string
  /**
   * Per-field URL map. Each field is either:
   *   - Has a URL → extract from that URL
   *   - Has null → explicitly skip extraction; keep current value
   *   - Missing key → treated same as null (skip)
   */
  fieldSourceUrls: FieldSourceUrls
  /**
   * Legacy single-URL mode fallback. Used when fieldSourceUrls is empty
   * (no per-field config). Scrapes this one URL and extracts ALL fields.
   * Maintained for backward compat with the original pipeline (migration 266).
   */
  legacySourceUrl?: string
  interactive?: boolean
}): Promise<ProgramExtractionResult> {
  const supabase = createAdminClient()

  // Build the URL→fields map. If no per-field URLs configured, fall back to
  // legacy single-URL mode (all fields from one page).
  const urlToFields = new Map<string, ProgramExtractableField[]>()

  const fieldsWithUrls = Object.entries(fieldSourceUrls).filter(([, url]) => typeof url === 'string' && url.trim().length > 0)

  if (fieldsWithUrls.length === 0 && legacySourceUrl) {
    // Legacy mode: one URL, all fields
    urlToFields.set(legacySourceUrl, [...ALL_EXTRACTABLE_FIELDS])
  } else {
    for (const [field, url] of fieldsWithUrls) {
      if (!isExtractableField(field)) continue
      const u = (url as string).trim()
      const existing = urlToFields.get(u) ?? []
      existing.push(field)
      urlToFields.set(u, existing)
    }
  }

  if (urlToFields.size === 0) {
    return { ok: false, error: 'No source URLs configured. Assign a URL to at least one field before running extraction.' }
  }

  // Pre-flight verify every URL. Collect any that fail.
  const uniqueUrls = Array.from(urlToFields.keys())
  const verifications = await Promise.all(uniqueUrls.map(async (u) => ({ url: u, result: await verifySourceUrl(u) })))
  const verifiedMap = new Map<string, string>()  // original URL → final URL after redirect
  const failedUrls: { url: string; error: string }[] = []
  for (const v of verifications) {
    if (v.result.ok) {
      verifiedMap.set(v.url, v.result.finalUrl)
    } else {
      failedUrls.push({ url: v.url, error: v.result.error })
    }
  }

  if (verifiedMap.size === 0) {
    // All URLs failed
    await supabase.from('program_extractions').insert({
      program_id: programId,
      source_url: uniqueUrls[0] ?? '',
      raw_markdown: null,
      markdown_chars: 0,
      used_interactive: interactive,
      extraction: {},
      model: MODEL,
      status: 'failed',
      error_message: `All URLs failed pre-flight: ${failedUrls.map((f) => `${f.url}: ${f.error}`).join('; ')}`,
    })
    return { ok: false, error: 'All URLs failed pre-flight verification.' }
  }

  // Per-URL extraction: for each verified URL, scrape and run a focused
  // Sonnet call extracting ONLY the mapped fields.
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not set' }
  const client = new Anthropic({ apiKey })

  const merged: ProgramExtraction = emptyExtraction()
  let totalInputTokens = 0
  let totalOutputTokens = 0
  const combinedMarkdownParts: string[] = []
  let primaryUrlForRecord = ''

  for (const [originalUrl, fields] of urlToFields.entries()) {
    const finalUrl = verifiedMap.get(originalUrl)
    if (!finalUrl) {
      // Pre-flight failed for this URL; skip its mapped fields
      merged.extraction_warnings.push(
        `Skipped fields (${fields.join(', ')}) — pre-flight failed for ${originalUrl}: ${failedUrls.find((f) => f.url === originalUrl)?.error ?? 'unknown'}`,
      )
      continue
    }

    primaryUrlForRecord = primaryUrlForRecord || finalUrl

    const markdown = interactive
      ? await fetchFirecrawlInteractive(finalUrl, { maxChars: PER_URL_MARKDOWN_LIMIT })
      : await fetchFirecrawl(finalUrl, { maxChars: PER_URL_MARKDOWN_LIMIT })

    if (!markdown) {
      merged.extraction_warnings.push(
        `Skipped fields (${fields.join(', ')}) — Firecrawl returned empty markdown for ${finalUrl}`,
      )
      continue
    }

    combinedMarkdownParts.push(`=== SOURCE: ${finalUrl} (fields: ${fields.join(', ')}) ===\n\n${markdown}`)

    // Focused Sonnet call: extract ONLY these fields from this markdown.
    const fieldList = fields.join(', ')
    let response
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 12000,
        system: PROGRAM_EXTRACTION_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: buildProgramExtractionUserPrompt(
            programName,
            programSlug,
            programType,
            finalUrl,
            markdown,
            { extractOnlyFields: fields, fieldList },
          ),
        }],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      merged.extraction_warnings.push(`Sonnet failed for ${finalUrl} (fields: ${fieldList}): ${message}`)
      continue
    }

    await logUsage(response, 'extract_program_content_per_field', { program_id: programId, source_url: finalUrl })
    totalInputTokens += response.usage?.input_tokens ?? 0
    totalOutputTokens += response.usage?.output_tokens ?? 0

    const textBlock = response.content.find((c) => c.type === 'text')
    if (!textBlock || textBlock.type !== 'text') continue
    const rawText = textBlock.text.trim()

    let parsed: ProgramExtraction
    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      if (!cleaned.startsWith('{')) {
        merged.extraction_warnings.push(
          `Sonnet returned prose (not JSON) for ${finalUrl}. First 100 chars: "${cleaned.slice(0, 100)}..."`,
        )
        continue
      }
      try {
        parsed = JSON.parse(cleaned) as ProgramExtraction
      } catch {
        parsed = JSON.parse(jsonrepair(cleaned)) as ProgramExtraction
      }
    } catch (err) {
      merged.extraction_warnings.push(
        `JSON parse failed for ${finalUrl}: ${err instanceof Error ? err.message : String(err)}`,
      )
      continue
    }

    // Merge ONLY the fields this URL was responsible for — ignore everything else
    for (const field of fields) {
      const extracted = (parsed as unknown as Record<string, unknown>)[field]
      if (extracted) {
        ;(merged as unknown as Record<string, unknown>)[field] = extracted
      }
    }
    if (parsed.extraction_warnings && parsed.extraction_warnings.length > 0) {
      merged.extraction_warnings.push(...parsed.extraction_warnings.map((w) => `[${finalUrl}]: ${w}`))
    }
  }

  // Review pass on the merged extraction — runs against the COMBINED markdown
  // from all URLs, looking for fields the per-URL passes missed.
  const combinedMarkdown = combinedMarkdownParts.join('\n\n')
  const review = await reviewProgramExtraction({
    programName,
    markdown: combinedMarkdown,
    programId,
    extraction: merged,
  })

  const finalExtraction = review.extraction

  // Persist
  const { data: inserted, error: insertErr } = await supabase
    .from('program_extractions')
    .insert({
      program_id: programId,
      source_url: primaryUrlForRecord,
      raw_markdown: combinedMarkdown.slice(0, 80_000),
      markdown_chars: combinedMarkdown.length,
      used_interactive: interactive,
      extraction: finalExtraction,
      model: MODEL,
      input_tokens: totalInputTokens || null,
      output_tokens: totalOutputTokens || null,
      review_pass_ran: review.ran,
      review_pass_added_count: review.addedFields,
      status: 'extracted',
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    return { ok: false, error: `DB insert failed: ${insertErr?.message ?? 'unknown'}` }
  }

  return { ok: true, extractionId: inserted.id, extraction: finalExtraction }
}

function isExtractableField(s: string): s is ProgramExtractableField {
  return (ALL_EXTRACTABLE_FIELDS as readonly string[]).includes(s)
}
