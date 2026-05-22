/**
 * Phase 5 — Auto-archive helper.
 *
 * Finds published alert variants whose parent topic ended 30+ days ago and
 * transitions them to status='archived' with metadata.archive_reason
 * ='auto-expired'. The trigger picks that up and projects alerts.status
 * 'rejected' (because archive_reason='rejected' is the hard variant; we use
 * a NEW reason 'auto-expired' that defaults to soft_rejected — preserving
 * Scout dedup semantics without polluting the manual reject lane).
 *
 * Why archive vs. hard-delete: rows stay in DB for audit (matches the plan's
 * "No DELETE — rows stay in DB for audit" rule). URLs continue to resolve so
 * any social links / cached pages still hit a "this offer ended" page rather
 * than a 404.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const ARCHIVE_GRACE_DAYS = 30

export interface AutoArchiveResult {
  ok: boolean
  scanned: number
  archived: number
  errors: number
  examples: { id: string; slug: string; endedAt: string }[]
}

export async function autoArchiveExpiredVariants(
  supabase: SupabaseClient,
): Promise<AutoArchiveResult> {
  const cutoff = new Date(Date.now() - ARCHIVE_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: candidates, error } = await supabase
    .from('content_variants')
    .select('id, metadata, topics:topics!inner(id, slug, end_date)')
    .eq('format', 'alert')
    .eq('status', 'published')
    .not('topics.end_date', 'is', null)
    .lt('topics.end_date', cutoff)

  if (error) {
    console.error('[autoArchive] candidate query failed:', error.message)
    return { ok: false, scanned: 0, archived: 0, errors: 1, examples: [] }
  }

  const rows = (candidates ?? []) as Array<{
    id: string
    metadata: Record<string, unknown> | null
    topics: { id: string; slug: string; end_date: string } | { id: string; slug: string; end_date: string }[]
  }>

  let archived = 0
  let errors = 0
  const examples: { id: string; slug: string; endedAt: string }[] = []
  const nowIso = new Date().toISOString()

  for (const row of rows) {
    const t = Array.isArray(row.topics) ? row.topics[0] : row.topics
    const newMetadata = {
      ...(row.metadata ?? {}),
      archive_reason: 'auto-expired',
      archived_at: nowIso,
    }
    const { error: uErr } = await supabase
      .from('content_variants')
      .update({ status: 'archived', metadata: newMetadata, archived_at: nowIso })
      .eq('id', row.id)
    if (uErr) {
      console.error(`[autoArchive] archive failed for variant ${row.id}:`, uErr.message)
      errors++
      continue
    }
    archived++
    if (examples.length < 5) examples.push({ id: row.id, slug: t.slug, endedAt: t.end_date })
  }

  return { ok: errors === 0, scanned: rows.length, archived, errors, examples }
}
