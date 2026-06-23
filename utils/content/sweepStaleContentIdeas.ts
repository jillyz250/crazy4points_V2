/**
 * Content-ideas queue hygiene.
 *
 * The daily brief generates 'new' content ideas faster than they're reviewed,
 * and nothing ages them out — so the queue grew to 364 'new' (198 older than a
 * month, oldest from April). The dashboard tile then counts the whole firehose,
 * which stops meaning "fresh, actionable ideas."
 *
 * This sweep moves stale 'new' ideas (untouched for >STALE_DAYS) to 'idea_bank'
 * — KEPT and still browsable, just out of the live "open ideas" count. Only
 * touches 'new'; 'queued'/'drafted' are actively being worked and never aged
 * out. Runs daily via /api/cron/content-ideas-sweep.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const STALE_DAYS = 30

export interface ContentIdeaSweepResult {
  ok: boolean
  movedToIdeaBank: number
  errors: number
}

export async function sweepStaleContentIdeas(supabase: SupabaseClient): Promise<ContentIdeaSweepResult> {
  const cutoff = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString()
  const { data, error } = await supabase
    .from('content_ideas')
    .update({ status: 'idea_bank' })
    .eq('status', 'new')
    .lt('created_at', cutoff)
    .select('id')
  if (error) return { ok: false, movedToIdeaBank: 0, errors: 1 }
  return { ok: true, movedToIdeaBank: data?.length ?? 0, errors: 0 }
}
