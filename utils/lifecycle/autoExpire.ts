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

export interface AutoExpireResult {
  ok: boolean
  scanned: number
  touched: number
  errors: number
  examples: { id: string; slug: string; endedAt: string }[]
}

export async function autoExpirePublishedVariants(
  supabase: SupabaseClient,
): Promise<AutoExpireResult> {
  const nowIso = new Date().toISOString()

  // Pull all currently-published alert variants whose topic has ended.
  // Topic is the source of truth for end_date.
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
