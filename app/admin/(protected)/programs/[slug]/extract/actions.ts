'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { extractProgramContent } from '@/utils/programs/extractProgramContent'
import { applyProgramField, skipProgramField, isApplyableField } from '@/utils/programs/applyProgramField'
import { mergeExtractedField, isMergeableField } from '@/utils/programs/mergeExtractedField'
import { verifyExtractedField, isVerifiableField } from '@/utils/programs/verifyExtractedField'
import { discoverSourceUrls } from '@/utils/programs/discoverSourceUrls'

/**
 * Run extraction on a program. Writes to program_extractions cache only —
 * does NOT touch programs.* (per-field approval is editor-driven).
 */
export async function runProgramExtraction(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const interactive = formData.get('interactive') === 'on'

  if (!slug) {
    console.error('[program-extract] missing slug')
    return
  }

  // Per-field URLs come in as form fields named "field_url_<fieldname>".
  // Each field's value is a textarea — one URL per line. Trim, filter empties.
  // Store as array (single URL = single-item array; empty = null).
  const fieldSourceUrls: Record<string, string[] | null> = {}
  const fieldNames = ['intro', 'sweet_spots', 'lounge_access', 'quirks', 'award_chart', 'tier_benefits', 'alliance', 'hubs', 'parent_program_slug']
  for (const field of fieldNames) {
    const raw = String(formData.get(`field_url_${field}`) ?? '').trim()
    if (!raw) {
      fieldSourceUrls[field] = null
      continue
    }
    const urls = raw
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
    fieldSourceUrls[field] = urls.length > 0 ? urls : null
  }

  // Legacy "single URL" mode — optional fallback when no per-field URLs
  const legacySourceUrl = String(formData.get('source_url') ?? '').trim() || undefined

  const supabase = createAdminClient()
  const { data: program, error } = await supabase
    .from('programs')
    .select('id, name, slug, type, extraction_source_url, field_source_urls')
    .eq('slug', slug)
    .single()

  if (error || !program) {
    console.error(`[program-extract] program not found: ${slug}`)
    return
  }

  // Persist field URLs + primary URL on the program row so they pre-fill next time.
  const urlUpdate: Record<string, unknown> = {}
  if (legacySourceUrl && legacySourceUrl !== program.extraction_source_url) {
    urlUpdate.extraction_source_url = legacySourceUrl
  }
  // Only store non-null entries in jsonb
  const sourceUrlsToStore = Object.fromEntries(
    Object.entries(fieldSourceUrls).filter(([, v]) => v !== null),
  )
  const existingFieldUrls = (program.field_source_urls as Record<string, string | null> | null) ?? {}
  if (JSON.stringify(sourceUrlsToStore) !== JSON.stringify(existingFieldUrls)) {
    urlUpdate.field_source_urls = sourceUrlsToStore
  }
  if (Object.keys(urlUpdate).length > 0) {
    await supabase.from('programs').update(urlUpdate).eq('id', program.id)
  }

  const result = await extractProgramContent({
    programId: program.id,
    programName: program.name,
    programSlug: program.slug,
    programType: program.type ?? 'airline',
    fieldSourceUrls,
    legacySourceUrl,
    interactive,
  })

  if (!result.ok) {
    console.error(`[program-extract] failed: ${result.error}`)
  } else {
    console.log(`[program-extract] extraction ${result.extractionId} ready for review`)
  }

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Apply a single extracted field to the programs row. Snapshots prior to
 * program_field_history first; updates programs.<field>; marks applied on
 * the extraction row.
 */
export async function applyExtractedField(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()
  const newValueRaw = String(formData.get('new_value_json') ?? 'null')

  if (!slug || !extractionId || !isApplyableField(field)) {
    console.error(`[program-extract] invalid apply request: slug=${slug} field=${field}`)
    return
  }

  let newValue: unknown
  try {
    newValue = JSON.parse(newValueRaw)
  } catch (err) {
    console.error(`[program-extract] invalid new_value JSON for field=${field}: ${err}`)
    return
  }

  const supabase = createAdminClient()
  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!program) {
    console.error(`[program-extract] program not found: ${slug}`)
    return
  }

  const result = await applyProgramField({
    programId: program.id,
    field,
    newValue,
    extractionId,
  })

  if (!result.ok) {
    console.error(`[program-extract] apply failed for ${field}: ${result.error}`)
  }

  // Revalidate both admin extract + public program page
  revalidatePath(`/admin/programs/${slug}/extract`)
  revalidatePath(`/programs/${slug}`)
}

/**
 * Mark a field as skipped on the extraction row. Doesn't touch programs.*.
 */
export async function skipExtractedField(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()

  if (!slug || !extractionId || !isApplyableField(field)) return

  await skipProgramField({ field, extractionId })

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Merge the current and extracted versions of a field using Sonnet.
 * Result is stored in program_extractions.merged_fields[<field>]; Apply
 * uses the merged value when present.
 */
export async function mergeProgramField(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()

  if (!slug || !extractionId || !isMergeableField(field)) {
    console.error(`[program-extract] invalid merge request: slug=${slug} field=${field}`)
    return
  }

  const supabase = createAdminClient()
  // Use any-cast on the select since we're passing a dynamic field name.
  // Safety: isMergeableField() above whitelisted `field` to a known small set.
  const { data: program } = (await supabase
    .from('programs')
    .select(`id, ${field}`)
    .eq('slug', slug)
    .single()) as unknown as { data: Record<string, unknown> | null }

  if (!program) return

  const { data: extraction } = await supabase
    .from('program_extractions')
    .select('extraction')
    .eq('id', extractionId)
    .single()

  if (!extraction) return

  // Current value from programs.<field> — text fields are strings
  const currentValue = program[field] as string | null

  // Extracted value from the extraction jsonb — text fields use { value, source_quote, confidence }
  const extractedField = (extraction.extraction as Record<string, unknown> | null)?.[field]
  const extractedValue = (extractedField as { value?: string } | null)?.value ?? null

  if (!currentValue || !extractedValue) {
    console.error(`[program-extract] merge skipped — current or extracted is empty for ${field}`)
    return
  }

  const result = await mergeExtractedField({
    programId: program.id as string,
    field,
    currentValue,
    extractedValue,
    extractionId,
  })

  if (!result.ok) {
    console.error(`[program-extract] merge failed for ${field}: ${result.error}`)
  }

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Discover candidate source URLs for each extraction field by mapping a
 * starting domain and asking Sonnet to classify the results. Persists to
 * programs.suggested_field_urls so the editor can review and apply.
 */
export async function discoverProgramSourceUrls(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const startingUrl = String(formData.get('starting_url') ?? '').trim()

  if (!slug || !startingUrl) {
    console.error(`[program-discover] missing slug or starting URL`)
    return
  }

  const supabase = createAdminClient()
  const { data: program } = await supabase
    .from('programs')
    .select('id, name, type')
    .eq('slug', slug)
    .single()

  if (!program) {
    console.error(`[program-discover] program not found: ${slug}`)
    return
  }

  const result = await discoverSourceUrls({
    programId: program.id,
    programName: program.name,
    programType: program.type ?? 'airline',
    startingUrl,
  })

  if (!result.ok) {
    console.error(`[program-discover] failed: ${result.error}`)
  } else {
    console.log(
      `[program-discover] mapped ${result.total_urls_seen} urls -> ${result.candidates_sent_to_sonnet} candidates -> ${Object.values(result.suggestions).filter((v) => v != null).length} field matches`,
    )
  }

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Apply discovered URL suggestions to programs.field_source_urls in bulk.
 * Overwrites any existing per-field URLs with the suggestions. Skips fields
 * where the suggestion is null.
 */
export async function applyDiscoveredUrls(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  if (!slug) return

  const supabase = createAdminClient()
  const { data: program } = await supabase
    .from('programs')
    .select('id, suggested_field_urls')
    .eq('slug', slug)
    .single()

  if (!program) return

  const suggestions =
    (program.suggested_field_urls as Record<string, { urls?: string[] } | null> | null) ?? {}

  const newFieldUrls: Record<string, string[]> = {}
  for (const [field, s] of Object.entries(suggestions)) {
    // Skip metadata keys
    if (['generated_at', 'starting_url', 'total_urls_seen', 'candidates_sent'].includes(field)) continue
    if (s && Array.isArray(s.urls) && s.urls.length > 0) {
      newFieldUrls[field] = s.urls
    }
  }

  await supabase
    .from('programs')
    .update({ field_source_urls: newFieldUrls })
    .eq('id', program.id)

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Auto-verify an extracted field against the scraped source markdown.
 * Calls Sonnet with current + extracted + raw markdown; stores a verdict
 * and a corrected final version in program_extractions.verifications[field].
 * Apply picks up corrected_value when present.
 */
export async function verifyProgramField(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()

  if (!slug || !extractionId || !isVerifiableField(field)) {
    console.error(`[program-extract] invalid verify request: slug=${slug} field=${field}`)
    return
  }

  const supabase = createAdminClient()
  const { data: program } = (await supabase
    .from('programs')
    .select(`id, ${field}`)
    .eq('slug', slug)
    .single()) as unknown as { data: Record<string, unknown> | null }

  if (!program) return

  const { data: extraction } = await supabase
    .from('program_extractions')
    .select('extraction, raw_markdown')
    .eq('id', extractionId)
    .single()

  if (!extraction) return

  const currentValue = (program[field] as string | null) ?? ''
  const extractedField = (extraction.extraction as Record<string, unknown> | null)?.[field]
  const extractedValue = (extractedField as { value?: string } | null)?.value ?? ''
  const markdown = (extraction.raw_markdown as string | null) ?? ''

  if (!currentValue || !extractedValue || !markdown) {
    console.error(`[program-extract] verify skipped — missing current/extracted/markdown for ${field}`)
    return
  }

  const result = await verifyExtractedField({
    programId: program.id as string,
    field,
    currentValue,
    extractedValue,
    markdown,
    extractionId,
  })

  if (!result.ok) {
    console.error(`[program-extract] verify failed for ${field}: ${result.error}`)
  }

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Save a manually-edited override for a field. Editor paste-target:
 *   "Copy review prompt" -> Claude reviews + edits/verifies -> paste back here.
 *
 * Writes to program_extractions.merged_fields[field] with source='manual_edit'
 * so the Apply button picks it up the same way it picks up auto-merge results.
 * The original extracted value stays untouched in extraction.<field>.
 *
 * Only allowed for mergeable (text) fields. Structured fields (tier_benefits,
 * hubs, alliance) should be edited via /admin/programs/[slug]/edit instead.
 */
export async function saveManualOverride(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()
  const value = String(formData.get('value') ?? '').trim()

  if (!slug || !extractionId || !isMergeableField(field)) {
    console.error(`[program-extract] invalid manual override: slug=${slug} field=${field}`)
    return
  }
  if (!value) {
    console.error(`[program-extract] manual override is empty for ${field}`)
    return
  }

  const supabase = createAdminClient()
  const { data: extractionRow } = await supabase
    .from('program_extractions')
    .select('merged_fields')
    .eq('id', extractionId)
    .single()

  const mergedFields = ((extractionRow?.merged_fields as Record<string, { value: string; generated_at: string; source?: string }> | null) ?? {})
  mergedFields[field] = {
    value,
    generated_at: new Date().toISOString(),
    source: 'manual_edit',
  }

  await supabase
    .from('program_extractions')
    .update({ merged_fields: mergedFields })
    .eq('id', extractionId)

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Mark the entire extraction as completed (editor done reviewing).
 */
export async function completeExtraction(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()
  if (!slug || !extractionId) return

  const supabase = createAdminClient()
  await supabase
    .from('program_extractions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', extractionId)

  revalidatePath(`/admin/programs/${slug}/extract`)
}
