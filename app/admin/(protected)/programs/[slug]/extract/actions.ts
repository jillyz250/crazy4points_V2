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
  const sourceUrl = String(formData.get('source_url') ?? '').trim()
  const interactive = formData.get('interactive') === 'on'

  if (!slug || !sourceUrl) {
    console.error('[program-extract] missing slug or source_url')
    return
  }

  const supabase = createAdminClient()
  const { data: program, error } = await supabase
    .from('programs')
    .select('id, name, slug, type, extraction_source_url')
    .eq('slug', slug)
    .single()

  if (error || !program) {
    console.error(`[program-extract] program not found: ${slug}`)
    return
  }

  // Persist the URL on the program row first time it's typed in.
  if (sourceUrl !== program.extraction_source_url) {
    await supabase
      .from('programs')
      .update({ extraction_source_url: sourceUrl })
      .eq('id', program.id)
  }

  const result = await extractProgramContent({
    programId: program.id,
    programName: program.name,
    programSlug: program.slug,
    programType: program.type ?? 'airline',
    sourceUrl,
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
