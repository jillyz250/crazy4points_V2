/**
 * Phase 5 — Auto-expire helper.
 *
 * Finds published alert variants whose parent topic.end_date is in the past
 * and touches them so the variants→alerts trigger fires and projects the
 * derived `alerts.status='expired'` state.
 *
 * Why touch instead of UPDATE status: in the variants model "expired" is a
 * derived state on the alerts mirror — the variant itself stays `published`
 * until manually archived (handled by the separate auto-archive job at
 * end_date + 30 days). The trigger maps:
 *   variant.status=published + topic.end_date < now() → alerts.status=expired
 *
 * So all this helper needs to do is bump `updated_at` on each candidate row.
 * The trigger re-projects everything else.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { rejectAlertVariant } from '@/utils/content/writeAlertVariant'
import { isAlertActiveET } from '@/lib/alerts/expiry'

export interface AutoExpireResult {
  ok: boolean
  scanned: number
  touched: number
  errors: number
  examples: { id: string; slug: string; endedAt: string }[]
}

export interface AutoRejectDraftsResult {
  ok: boolean
  scanned: number
  rejected: number
  errors: number
  examples: { id: string; title: string; endDate: string }[]
}

/**
 * Auto-reject pending_review drafts whose end_date is already in the PAST
 * (strictly before today, US Eastern). Keeps stale limited-time-offer drafts
 * out of the daily triage queue so the editor never sees a deal that already
 * ended. Drafts ending TODAY are preserved (still publishable that morning).
 * Rejection goes through rejectAlertVariant so the topic+variant archive and
 * the alerts mirror re-projects correctly.
 */
export async function autoRejectExpiredDrafts(
  supabase: SupabaseClient,
): Promise<AutoRejectDraftsResult> {
  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) // YYYY-MM-DD

  const { data, error } = await supabase
    .from('alerts')
    .select('id, title, end_date')
    .eq('status', 'pending_review')
    .not('end_date', 'is', null)
    .lt('end_date', todayET)

  if (error) {
    console.error('[autoRejectExpiredDrafts] query failed:', error.message)
    return { ok: false, scanned: 0, rejected: 0, errors: 1, examples: [] }
  }

  const rows = (data ?? []) as Array<{ id: string; title: string | null; end_date: string }>
  let rejected = 0
  let errors = 0
  const examples: { id: string; title: string; endDate: string }[] = []

  for (const r of rows) {
    try {
      await rejectAlertVariant(supabase, r.id, {
        kind: 'rejected',
        rejectedReason: `auto-expired: end_date ${r.end_date} passed before publish`,
      })
      rejected++
      if (examples.length < 5) examples.push({ id: r.id, title: (r.title ?? '').slice(0, 60), endDate: r.end_date })
    } catch (e) {
      console.error(`[autoRejectExpiredDrafts] reject failed for ${r.id}:`, (e as Error).message)
      errors++
    }
  }

  return { ok: errors === 0, scanned: rows.length, rejected, errors, examples }
}

export async function autoExpirePublishedVariants(
  supabase: SupabaseClient,
): Promise<AutoExpireResult> {
  const nowIso = new Date().toISOString()

  // Pull all currently-published alert variants whose topic has ended.
  // Topic is the source of truth for end_date.
  //
  // The SQL filter uses a coarse UTC `end_date < now` bound: it over-selects
  // (an alert ending "July 7" satisfies this from midnight UTC on July 7, which
  // is 8pm ET on July 6) but never misses a truly-expired row. The per-row
  // isAlertActiveET() check below then applies the SAME ET-day semantics the
  // public read path uses (lib/alerts/expiry.ts), so we only expire a variant
  // once it has actually ended in Eastern time — not up to ~28h early.
  const { data: candidates, error } = await supabase
    .from('content_variants')
    .select('id, updated_at, topics:topics!inner(id, slug, end_date)')
    .eq('format', 'alert')
    .eq('status', 'published')
    .not('topics.end_date', 'is', null)
    .lt('topics.end_date', nowIso)

  if (error) {
    console.error('[autoExpire] candidate query failed:', error.message)
    return { ok: false, scanned: 0, touched: 0, errors: 1, examples: [] }
  }

  const rows = (candidates ?? []) as Array<{
    id: string
    updated_at: string | null
    topics: { id: string; slug: string; end_date: string } | { id: string; slug: string; end_date: string }[]
  }>

  let touched = 0
  let errors = 0
  const examples: { id: string; slug: string; endedAt: string }[] = []

  for (const row of rows) {
    const t = Array.isArray(row.topics) ? row.topics[0] : row.topics
    // Strict ET check — the coarse SQL bound over-selects rows that ended in
    // UTC but are still live through end-of-day Eastern. Skip those so the
    // alert doesn't vanish from the site early.
    if (isAlertActiveET(t.end_date)) continue
    const { error: tErr } = await supabase
      .from('content_variants')
      .update({ updated_at: nowIso })
      .eq('id', row.id)
    if (tErr) {
      console.error(`[autoExpire] touch failed for variant ${row.id}:`, tErr.message)
      errors++
      continue
    }
    touched++
    if (examples.length < 5) examples.push({ id: row.id, slug: t.slug, endedAt: t.end_date })
  }

  return { ok: errors === 0, scanned: rows.length, touched, errors, examples }
}
