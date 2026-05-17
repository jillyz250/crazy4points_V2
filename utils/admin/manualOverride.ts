/**
 * Manual override helper — sets a field value AND tracks provenance.
 *
 * Use this anywhere an editor manually sets a card/program field that the
 * auto-extraction pipeline can't verify (FX fee, credit_score_recommended,
 * authorized_user_fee, hub airports for some programs, etc.).
 *
 * After the override is set, the value lives on the row column AS USUAL, plus
 * a parallel entry in manual_overrides jsonb tracks set_at + note. The
 * /admin/manual-overrides admin page lists overrides older than N days for
 * editor re-verification.
 */

import { createAdminClient } from '@/utils/supabase/server'

const SUPPORTED_TABLES = ['credit_cards', 'programs'] as const
type SupportedTable = (typeof SUPPORTED_TABLES)[number]

export type ManualOverrideEntry = {
  value: unknown
  set_at: string
  set_by: string
  note: string
}

export type SetManualOverrideResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Update a single field on credit_cards or programs AND record the
 * manual-override provenance. Idempotent: re-setting the same value still
 * refreshes set_at (so re-verification counts).
 */
export async function setManualOverride({
  table,
  slug,
  field,
  value,
  note,
  setBy = 'editor',
}: {
  table: SupportedTable
  slug: string
  field: string
  value: unknown
  note?: string
  setBy?: string
}): Promise<SetManualOverrideResult> {
  if (!SUPPORTED_TABLES.includes(table)) {
    return { ok: false, error: `Unsupported table: ${table}` }
  }
  if (!slug || !field) {
    return { ok: false, error: 'slug and field are required' }
  }

  const supabase = createAdminClient()

  // 1. Read current manual_overrides
  const { data: row, error: readErr } = await supabase
    .from(table)
    .select('id, manual_overrides')
    .eq('slug', slug)
    .single()

  if (readErr || !row) {
    return { ok: false, error: `${table} not found for slug=${slug}` }
  }

  const existing = (row.manual_overrides as Record<string, ManualOverrideEntry> | null) ?? {}
  existing[field] = {
    value,
    set_at: new Date().toISOString(),
    set_by: setBy,
    note: note ?? '',
  }

  // 2. Update value column + manual_overrides jsonb in one call
  const updatePayload: Record<string, unknown> = {
    [field]: value,
    manual_overrides: existing,
  }

  const { error: writeErr } = await supabase
    .from(table)
    .update(updatePayload)
    .eq('id', row.id)

  if (writeErr) {
    return { ok: false, error: `Update failed: ${writeErr.message}` }
  }

  return { ok: true }
}

/**
 * Fetch all manual overrides across credit_cards and programs, joined with
 * the slug/name, sorted by set_at ascending (oldest first). Used by the
 * /admin/manual-overrides report.
 */
export type ManualOverrideRow = {
  table: SupportedTable
  slug: string
  name: string
  field: string
  value: unknown
  set_at: string
  set_by: string
  note: string
  age_days: number
}

export async function listAllManualOverrides(): Promise<ManualOverrideRow[]> {
  const supabase = createAdminClient()
  const rows: ManualOverrideRow[] = []
  const now = Date.now()

  for (const table of SUPPORTED_TABLES) {
    const { data } = await supabase
      .from(table)
      .select('slug, name, manual_overrides')
      .not('manual_overrides', 'eq', '{}')

    for (const r of (data ?? []) as Array<{ slug: string; name: string; manual_overrides: Record<string, ManualOverrideEntry> }>) {
      for (const [field, entry] of Object.entries(r.manual_overrides ?? {})) {
        const setAtMs = new Date(entry.set_at).getTime()
        const ageDays = Math.max(0, Math.round((now - setAtMs) / (1000 * 60 * 60 * 24)))
        rows.push({
          table,
          slug: r.slug,
          name: r.name,
          field,
          value: entry.value,
          set_at: entry.set_at,
          set_by: entry.set_by,
          note: entry.note,
          age_days: ageDays,
        })
      }
    }
  }

  rows.sort((a, b) => b.age_days - a.age_days)
  return rows
}
