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

/**
 * Per-field URL configuration. Each field can map to:
 *   - A single string URL (legacy / convenience)
 *   - An array of URLs (multi-source — markdown from all URLs combined,
 *     focused Sonnet call extracts the field from the combined input)
 *   - null or missing key (skip extraction for that field)
 */
export type FieldSourceUrls = Partial<Record<ProgramExtractableField, string | string[] | null>>

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

  // Normalize each field's URL config to an array of URLs (single string
  // becomes a single-item array; null/missing stays empty).
  const fieldToUrls = new Map<ProgramExtractableField, string[]>()
  for (const field of ALL_EXTRACTABLE_FIELDS) {
    const raw = fieldSourceUrls[field]
    if (raw == null) continue
    const list = Array.isArray(raw) ? raw : [raw]
    const cleaned = list
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter((u) => u.length > 0)
    if (cleaned.length > 0) fieldToUrls.set(field, cleaned)
  }

  // Legacy fallback: if NO per-field URLs configured and a legacySourceUrl
  // is provided, use it for every field (original migration 266 behavior).
  if (fieldToUrls.size === 0 && legacySourceUrl) {
    for (const f of ALL_EXTRACTABLE_FIELDS) fieldToUrls.set(f, [legacySourceUrl])
  }

  if (fieldToUrls.size === 0) {
    return { ok: false, error: 'No source URLs configured. Assign a URL to at least one field before running extraction.' }
  }

  // Collect all unique URLs across all fields.
  const allUrls = new Set<string>()
  for (const urls of fieldToUrls.values()) urls.forEach((u) => allUrls.add(u))

  // Pre-flight verify every unique URL in parallel.
  const verifications = await Promise.all(
    Array.from(allUrls).map(async (u) => ({ url: u, result: await verifySourceUrl(u) })),
  )
  const verifiedMap = new Map<string, string>()  // original URL → final URL after redirect
  const failedUrls: { url: string; error: string }[] = []
  for (const v of verifications) {
    if (v.result.ok) verifiedMap.set(v.url, v.result.finalUrl)
    else failedUrls.push({ url: v.url, error: v.result.error })
  }

  if (verifiedMap.size === 0) {
    await supabase.from('program_extractions').insert({
      program_id: programId,
      source_url: Array.from(allUrls)[0] ?? '',
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

  // Pre-scrape each unique verified URL exactly ONCE — no matter how many
  // fields reference it. Stored in markdownByUrl for per-field combination.
  const markdownByUrl = new Map<string, string>()
  await Promise.all(
    Array.from(verifiedMap.entries()).map(async ([originalUrl, finalUrl]) => {
      const md = interactive
        ? await fetchFirecrawlInteractive(finalUrl, { maxChars: PER_URL_MARKDOWN_LIMIT })
        : await fetchFirecrawl(finalUrl, { maxChars: PER_URL_MARKDOWN_LIMIT })
      if (md) markdownByUrl.set(originalUrl, md)
    }),
  )

  // Group fields by URL SET (fields with the same set of URLs share a
  // Sonnet call). Group key = sorted comma-joined URLs.
  const groups = new Map<string, { urls: string[]; fields: ProgramExtractableField[] }>()
  for (const [field, urls] of fieldToUrls.entries()) {
    const validUrls = urls.filter((u) => verifiedMap.has(u) && markdownByUrl.has(u))
    if (validUrls.length === 0) continue
    const key = [...validUrls].sort().join('|')
    const existing = groups.get(key)
    if (existing) existing.fields.push(field)
    else groups.set(key, { urls: validUrls, fields: [field] })
  }

  if (groups.size === 0) {
    return { ok: false, error: 'All field URLs failed scrape; nothing to extract.' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not set' }
  const client = new Anthropic({ apiKey })

  const merged: ProgramExtraction = emptyExtraction()
  let totalInputTokens = 0
  let totalOutputTokens = 0
  const combinedMarkdownParts: string[] = []
  let primaryUrlForRecord = ''

  // Track skipped fields (URLs failed pre-flight or scrape)
  for (const [field, urls] of fieldToUrls.entries()) {
    const allFailed = urls.every((u) => !markdownByUrl.has(u))
    if (allFailed) {
      const failedDetails = urls
        .map((u) => failedUrls.find((f) => f.url === u)?.error ?? 'no markdown')
        .join('; ')
      merged.extraction_warnings.push(
        `Skipped field "${field}" — all URLs failed: ${failedDetails}`,
      )
    }
  }

  for (const { urls, fields } of groups.values()) {
    // Combine markdown from this group's URLs with section headers
    const groupMarkdown = urls
      .map((u) => {
        const finalUrl = verifiedMap.get(u) ?? u
        return `=== SOURCE: ${finalUrl} ===\n\n${markdownByUrl.get(u) ?? ''}`
      })
      .join('\n\n')

    primaryUrlForRecord = primaryUrlForRecord || (verifiedMap.get(urls[0]) ?? urls[0])
    combinedMarkdownParts.push(`=== GROUP fields(${fields.join(',')}) ===\n${groupMarkdown}`)

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
            urls.join(', '),  // composite URL string for prompt context
            groupMarkdown,
            { extractOnlyFields: fields, fieldList },
          ),
        }],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      merged.extraction_warnings.push(`Sonnet failed for group (fields: ${fieldList}): ${message}`)
      continue
    }

    await logUsage(response, 'extract_program_content_per_field', {
      program_id: programId,
      url_count: urls.length,
      fields: fields.join(','),
    })
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
          `Sonnet returned prose (not JSON) for group (fields: ${fieldList}). First 100 chars: "${cleaned.slice(0, 100)}..."`,
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
        `JSON parse failed for group (fields: ${fieldList}): ${err instanceof Error ? err.message : String(err)}`,
      )
      continue
    }

    // Merge ONLY the fields this group was responsible for
    for (const field of fields) {
      const extracted = (parsed as unknown as Record<string, unknown>)[field]
      if (extracted) {
        ;(merged as unknown as Record<string, unknown>)[field] = extracted
      }
    }
    if (parsed.extraction_warnings && parsed.extraction_warnings.length > 0) {
      merged.extraction_warnings.push(...parsed.extraction_warnings.map((w) => `[fields: ${fieldList}]: ${w}`))
    }
  }

  // Review pass on the merged extraction — runs against the COMBINED markdown
  // from all URLs, looking for fields the per-URL passes missed.
  // CRUCIAL: pass skipFields (fields with no source URL) so review doesn't
  // override the editor's "keep manual" intent.
  const skipFields = ALL_EXTRACTABLE_FIELDS.filter((f) => !fieldToUrls.has(f))
  const combinedMarkdown = combinedMarkdownParts.join('\n\n')
  const review = await reviewProgramExtraction({
    programName,
    markdown: combinedMarkdown,
    programId,
    extraction: merged,
    skipFields,
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
