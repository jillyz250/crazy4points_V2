/**
 * Stale alert-draft hygiene.
 *
 * Scout-generated alert drafts land at content_variants.status='needs_review'
 * and require a human approve/reject. News decays, so unreviewed drafts pile up
 * dead (found 10 of 47 older than 21 days, some for events that already started).
 * Nothing prunes them, so the "Pending review" count never reflects reality.
 *
 * This sweep hard-rejects alert drafts left unreviewed for >GRACE_DAYS, applying
 * the SAME writes as rejectAlertVariant (topic + variant -> archived, with
 * metadata.archive_reason='rejected') so the variants->alerts trigger projects
 * alerts.status='rejected' and Scout's dedup won't resurface them. It NEVER
 * touches snoozed drafts (you parked those deliberately) and only the 'alert'
 * format. Runs daily via /api/cron/stale-drafts-sweep.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const GRACE_DAYS = 21

export interface StaleDraftSweepResult {
  ok: boolean
  rejected: number
  errors: number
}

export async function sweepStaleAlertDrafts(supabase: SupabaseClient): Promise<StaleDraftSweepResult> {
  const nowIso = new Date().toISOString()
  const cutoff = new Date(Date.now() - GRACE_DAYS * 86_400_000).toISOString()

  // Eligible: alert drafts still needing review, older than the grace window,
  // not currently snoozed.
  const { data: stale, error: selErr } = await supabase
    .from('content_variants')
    .select('id, topic_id, metadata')
    .eq('status', 'needs_review')
    .eq('format', 'alert')
    .lt('created_at', cutoff)
    .or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`)
  if (selErr) return { ok: false, rejected: 0, errors: 1 }

  let rejected = 0
  let errors = 0
  for (const v of stale ?? []) {
    const newMeta = {
      ...((v.metadata as object) ?? {}),
      archive_reason: 'rejected',
      decided_at: nowIso,
      revisit_after: null,
      rejected_reason: 'auto:stale-news (unreviewed >21 days)',
    }
    // Mirror rejectAlertVariant: topic -> archived, variant -> archived.
    const { error: tErr } = await supabase.from('topics').update({ status: 'archived' }).eq('id', v.topic_id)
    const { error: vErr } = await supabase
      .from('content_variants')
      .update({ status: 'archived', archived_at: nowIso, metadata: newMeta })
      .eq('id', v.id)
    if (tErr || vErr) errors++
    else rejected++
  }

  return { ok: errors === 0, rejected, errors }
}
