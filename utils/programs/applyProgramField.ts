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

/**
 * GUARDIAN: detect when a value is "empty" enough that overwriting a
 * populated previous value would be destructive.
 *
 * Counted as empty:
 *   - null / undefined
 *   - empty string (after trim)
 *   - empty array (length 0)
 *   - object with zero own keys (treats {} JSONB as empty)
 *
 * NOT counted as empty (legitimate values):
 *   - 0, false, "0", etc.
 *   - arrays with items (even if every item is null — that's the editor's call)
 *   - objects with any key
 */
function isEmptyValue(v: unknown): boolean {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') return Object.keys(v as object).length === 0
  return false
}

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
  'award_category_chart',
  'free_night_certs',
] as const
export type ApplyableField = typeof ALLOWED_FIELDS[number]

export function isApplyableField(s: string): s is ApplyableField {
  return (ALLOWED_FIELDS as readonly string[]).includes(s)
}

export type ApplyResult =
  | { ok: true; field: ApplyableField; previousValue: unknown }
  | { ok: false; error: string; reason?: 'blank_guard' | 'snapshot_failed' | 'update_failed' | 'fetch_failed' }

export async function applyProgramField({
  programId,
  field,
  newValue,
  extractionId,
  allowBlank = false,
}: {
  programId: string
  field: ApplyableField
  newValue: unknown
  extractionId: string
  /**
   * GUARDIAN bypass — when true, allows writing an empty value over a populated
   * one (legitimate "Clear field" admin action). Default false: empty-over-
   * populated is refused with a blank_guard error.
   *
   * This is the non-destructive program-extraction safeguard. Same risk class
   * as PR #621 (non-destructive card extraction): a failed re-extraction
   * returning null for a field must NEVER blank that field unless the editor
   * explicitly intends to clear it.
   */
  allowBlank?: boolean
}): Promise<ApplyResult> {
  const supabase = createAdminClient()

  // 1. Fetch current value
  const { data: currentRow, error: fetchErr } = await supabase
    .from('programs')
    .select(field)
    .eq('id', programId)
    .single()

  if (fetchErr || !currentRow) {
    return { ok: false, error: `Could not read current value: ${fetchErr?.message ?? 'not found'}`, reason: 'fetch_failed' }
  }

  const previousValue = (currentRow as unknown as Record<string, unknown>)[field]

  // GUARDIAN: refuse to blank a populated field.
  // If the editor (or a re-extraction) submitted an empty new value but the
  // current value has real content, we stop here. Editor must explicitly opt
  // in via allowBlank=true to clear a field.
  if (!allowBlank && isEmptyValue(newValue) && !isEmptyValue(previousValue)) {
    return {
      ok: false,
      reason: 'blank_guard',
      error:
        `Refusing to blank populated field "${field}". The extraction returned no value, but the current value has content. ` +
        `If you intend to clear this field, use the explicit "Clear field" admin action (allowBlank=true) — never via Apply on an empty diff.`,
    }
  }

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
    return { ok: false, error: `Failed to snapshot prior value: ${histErr.message}`, reason: 'snapshot_failed' }
  }

  // 3. Update programs.<field>
  // Apply also resets BOTH freshness columns:
  //   content_updated_at (timestamptz) — last edit timestamp
  //   last_verified (date)             — last time content was verified
  //                                       against source. Driving the
  //                                       refresh-queue staleness flag.
  // Since extraction is a verification against the live source page,
  // applying that data IS a verification act — last_verified resets.
  const now = new Date()
  const updatePayload = {
    [field]: newValue,
    content_updated_at: now.toISOString(),
    last_verified: now.toISOString().slice(0, 10),  // YYYY-MM-DD
  } as Record<string, unknown>
  const { error: updateErr } = await supabase
    .from('programs')
    .update(updatePayload)
    .eq('id', programId)

  if (updateErr) {
    return { ok: false, error: `Update failed: ${updateErr.message}`, reason: 'update_failed' }
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
