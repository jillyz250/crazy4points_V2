/**
 * Per-field apply for program extraction.
 *
 * One field at a time. Editor reviews diff, clicks Apply → this function:
 *   1. Reads current value from programs.<field>
 *   2. Snapshots prior to program_field_history (rollback path)
 *   3. UPDATEs programs.<field> with the extracted value
 *   4. Marks the field in program_extractions.applied_fields['<field>'] = 'applied'
 *
 * NEVER overwrites without snapshotting first. Rollback by setting the
 * program_field_history.rolled_back=true and reverting programs.<field>
 * (handled by a separate revert action — not in this MVP).
 */

import { createAdminClient } from '@/utils/supabase/server'

const ALLOWED_FIELDS = [
  'intro',
  'sweet_spots',
  'lounge_access',
  'quirks',
  'award_chart',
  'alliance',
  'hubs',
  'parent_program_slug',
  'tier_benefits',
] as const
export type ApplyableField = typeof ALLOWED_FIELDS[number]

export function isApplyableField(s: string): s is ApplyableField {
  return (ALLOWED_FIELDS as readonly string[]).includes(s)
}

export type ApplyResult =
  | { ok: true; field: ApplyableField; previousValue: unknown }
  | { ok: false; error: string }

export async function applyProgramField({
  programId,
  field,
  newValue,
  extractionId,
}: {
  programId: string
  field: ApplyableField
  newValue: unknown
  extractionId: string
}): Promise<ApplyResult> {
  const supabase = createAdminClient()

  // 1. Fetch current value
  const { data: currentRow, error: fetchErr } = await supabase
    .from('programs')
    .select(field)
    .eq('id', programId)
    .single()

  if (fetchErr || !currentRow) {
    return { ok: false, error: `Could not read current value: ${fetchErr?.message ?? 'not found'}` }
  }

  const previousValue = (currentRow as unknown as Record<string, unknown>)[field]

  // 2. Snapshot to history BEFORE we overwrite
  const { error: histErr } = await supabase.from('program_field_history').insert({
    program_id: programId,
    field_name: field,
    previous_value: previousValue == null ? null : previousValue,
    new_value: newValue == null ? null : newValue,
    extraction_id: extractionId,
  })

  if (histErr) {
    // Hard fail — we never want to overwrite without a backup
    return { ok: false, error: `Failed to snapshot prior value: ${histErr.message}` }
  }

  // 3. Update programs.<field>
  const updatePayload = { [field]: newValue, content_updated_at: new Date().toISOString() } as Record<string, unknown>
  const { error: updateErr } = await supabase
    .from('programs')
    .update(updatePayload)
    .eq('id', programId)

  if (updateErr) {
    return { ok: false, error: `Update failed: ${updateErr.message}` }
  }

  // 4. Mark applied on the extraction row
  const { data: extractionRow } = await supabase
    .from('program_extractions')
    .select('applied_fields')
    .eq('id', extractionId)
    .single()

  const appliedFields = ((extractionRow?.applied_fields as Record<string, string> | null) ?? {})
  appliedFields[field] = 'applied'

  await supabase
    .from('program_extractions')
    .update({ applied_fields: appliedFields })
    .eq('id', extractionId)

  return { ok: true, field, previousValue }
}

/**
 * Skip a field — mark in extraction.applied_fields but don't touch programs.
 * Editor signaled they reviewed the field and chose to keep current value.
 */
export async function skipProgramField({
  field,
  extractionId,
}: {
  field: ApplyableField
  extractionId: string
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { data: extractionRow } = await supabase
    .from('program_extractions')
    .select('applied_fields')
    .eq('id', extractionId)
    .single()

  const appliedFields = ((extractionRow?.applied_fields as Record<string, string> | null) ?? {})
  appliedFields[field] = 'skipped'

  const { error } = await supabase
    .from('program_extractions')
    .update({ applied_fields: appliedFields })
    .eq('id', extractionId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
