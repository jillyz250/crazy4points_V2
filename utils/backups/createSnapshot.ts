/**
 * Core snapshot logic — used by the admin UI server action AND the CLI
 * script AND the nightly GitHub Action. Single source of truth.
 *
 * What it does:
 *   1. SELECT * from a curated list of "editorial" tables
 *   2. Bundle them into a JSON object: { table_name: [...rows], ... }
 *   3. Gzip the result
 *   4. Upload to Supabase Storage bucket `db-backups`
 *   5. Insert a row into `backup_snapshots` so it shows up in the admin UI
 *
 * Restore is NOT automated — see RESTORE.md. The snapshots are designed
 * to be human-readable + paste-able into Supabase SQL editor for surgical
 * restores. A full restore would require a small script (not yet built).
 */

import { gzipSync } from 'node:zlib'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Tables included in every snapshot. Curated to cover editorial work
 * (the stuff that's painful to lose) while skipping operational logs
 * (firecrawl_logs, usage_log) and high-churn extraction artifacts.
 */
export const SNAPSHOT_TABLES = [
  // Programs + cards: the bedrock reference content
  'programs',
  'credit_cards',
  'credit_card_benefits',
  'credit_card_welcome_bonuses',
  'issuers',
  // Junction tables that hold relationships
  'alert_programs',
  'card_co_brand_programs',
  // Editorial content surfaces
  'alerts',
  'topics',
  'content_variants',
  'blog_posts',
  // Newsletter
  'content_ideas',
  'subscribers',
  // Per-field undo trails (already a partial backup mechanism)
  'program_field_history',
  // Sources + promos
  'sources',
  'partner_redemptions',
  'hotel_properties',
  // Backup index itself (so a restore can rebuild this table too)
  'backup_snapshots',
] as const

export type SnapshotResult =
  | {
      ok: true
      snapshotId: string
      storagePath: string
      sizeBytes: number
      rowCounts: Record<string, number>
      durationMs: number
      /** The gzipped snapshot bytes, so callers can also ship an OFF-provider
       *  copy (e.g. email it) without a second storage round-trip. */
      gzBuffer: Buffer
    }
  | { ok: false; error: string }

export async function createSnapshot({
  supabase,
  label,
  takenBy,
  notes,
}: {
  supabase: SupabaseClient
  label?: string
  takenBy?: string
  notes?: string
}): Promise<SnapshotResult> {
  const start = Date.now()
  const safeLabel = (label ?? 'manual').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60)

  // Pull every table in parallel. Each SELECT * is bounded by Supabase's
  // server-side row limit (default 1000); we paginate for tables we know
  // can exceed that.
  const PAGED_TABLES = new Set(['hotel_properties', 'alerts', 'partner_redemptions'])
  const PAGE_SIZE = 1000

  const dump: Record<string, unknown[]> = {}
  const rowCounts: Record<string, number> = {}
  const errors: string[] = []

  await Promise.all(
    SNAPSHOT_TABLES.map(async (table) => {
      try {
        if (PAGED_TABLES.has(table)) {
          const all: unknown[] = []
          let from = 0
          // Paginated full scan
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .range(from, from + PAGE_SIZE - 1)
            if (error) {
              errors.push(`${table}: ${error.message}`)
              break
            }
            const rows = data ?? []
            all.push(...rows)
            if (rows.length < PAGE_SIZE) break
            from += PAGE_SIZE
          }
          dump[table] = all
          rowCounts[table] = all.length
        } else {
          const { data, error } = await supabase.from(table).select('*')
          if (error) {
            errors.push(`${table}: ${error.message}`)
            return
          }
          dump[table] = data ?? []
          rowCounts[table] = (data ?? []).length
        }
      } catch (err) {
        errors.push(`${table}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }),
  )

  if (errors.length > 0 && Object.keys(dump).length === 0) {
    return { ok: false, error: `All table dumps failed: ${errors.join('; ')}` }
  }

  // Serialize + gzip. Pretty-printed JSON because storage cost is trivial
  // here and human-readability matters when grepping a 6-month-old backup.
  const json = JSON.stringify(
    {
      meta: {
        taken_at: new Date().toISOString(),
        label: safeLabel,
        taken_by: takenBy ?? null,
        notes: notes ?? null,
        table_count: Object.keys(dump).length,
        row_counts: rowCounts,
        errors: errors.length > 0 ? errors : undefined,
      },
      tables: dump,
    },
    null,
    2,
  )
  const gz = gzipSync(Buffer.from(json, 'utf8'))

  // Storage path: snapshots/YYYY-MM-DD/<timestamp>-<label>.json.gz
  // Date-bucketed prefix keeps the list browsable in Supabase UI.
  const now = new Date()
  const datePrefix = now.toISOString().slice(0, 10)
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  const storagePath = `snapshots/${datePrefix}/${timestamp}-${safeLabel}.json.gz`

  const { error: uploadErr } = await supabase
    .storage
    .from('db-backups')
    .upload(storagePath, gz, {
      contentType: 'application/gzip',
      upsert: false,
    })

  if (uploadErr) {
    return { ok: false, error: `Storage upload failed: ${uploadErr.message}` }
  }

  // Record metadata
  const { data: inserted, error: insertErr } = await supabase
    .from('backup_snapshots')
    .insert({
      label: safeLabel,
      storage_path: storagePath,
      size_bytes: gz.length,
      tables_included: Object.keys(dump),
      row_counts: rowCounts,
      taken_by: takenBy ?? null,
      notes: notes ?? null,
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    return { ok: false, error: `Metadata insert failed: ${insertErr?.message ?? 'unknown'}` }
  }

  return {
    ok: true,
    snapshotId: inserted.id,
    storagePath,
    sizeBytes: gz.length,
    rowCounts,
    durationMs: Date.now() - start,
    gzBuffer: gz,
  }
}
