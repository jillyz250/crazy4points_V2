'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { extractProgramContent } from '@/utils/programs/extractProgramContent'
import { applyProgramField, skipProgramField, isApplyableField } from '@/utils/programs/applyProgramField'

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
