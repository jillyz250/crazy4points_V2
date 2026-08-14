/**
 * content_usage — the running ledger of stories we've published per channel, so we
 * don't repeat ourselves (newsletter headline, Jill's Take, Sweet Spot, social).
 *
 * - logContentUsage: write one or more usages (idempotent; the DB dedup index
 *   silently drops a re-log of the same story/channel/source).
 * - getRecentlyUsed: read what we've used recently, to steer the next pick away.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type UsageChannel =
  | 'newsletter_headline'
  | 'jills_take'
  | 'sweet_spot'
  | 'also_happening'
  | 'social'

export interface ContentUsageEntry {
  channel: UsageChannel
  ref_type?: 'alert' | 'intel' | null
  ref_id?: string | null
  ref_slug?: string | null
  title?: string | null
  used_at?: string | null
  source_ref?: string | null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function logContentUsage(
  supabase: SupabaseClient,
  entries: ContentUsageEntry[],
): Promise<number> {
  let logged = 0
  for (const e of entries) {
    // ref_id must be a real uuid or null (old headlines sometimes stored a title there).
    const refId = e.ref_id && UUID_RE.test(e.ref_id) ? e.ref_id : null
    if (!refId && !e.ref_slug && !e.title) continue // nothing identifiable to log
    const { error } = await supabase.from('content_usage').insert({
      channel: e.channel,
      ref_type: e.ref_type ?? null,
      ref_id: refId,
      ref_slug: e.ref_slug ?? null,
      title: e.title ?? null,
      used_at: e.used_at ?? new Date().toISOString(),
      source_ref: e.source_ref ?? null,
    })
    if (!error) logged++
    // 23505 = already logged (dedup index) — expected, ignore. Surface anything else.
    else if (error.code !== '23505' && !/duplicate key/i.test(error.message)) {
      console.error('[content_usage] insert failed:', error.message)
    }
  }
  return logged
}

/**
 * Backfill/sync the ledger from existing data — idempotent, safe to re-run.
 * Call before reading the ledger for a newsletter build so it reflects the most
 * recent sent issue + social posts. Sources: newsletters (headline / sweet_spot /
 * jills_take refs) and "Social post:" reminders (slug parsed from the link).
 */
export async function syncContentUsageFromHistory(supabase: SupabaseClient): Promise<number> {
  const entries: ContentUsageEntry[] = []

  const { data: nls } = await supabase
    .from('newsletters')
    .select('week_of, big_story_ref_id, big_story_ref_type, big_story_title, sweet_spot_ref_id, sweet_spot_ref_type, jills_take_ref_id')
  for (const n of nls ?? []) {
    const usedAt = n.week_of ? new Date(n.week_of as string).toISOString() : null
    const src = `nl:${n.week_of}`
    if (n.big_story_ref_id)
      entries.push({ channel: 'newsletter_headline', ref_type: (n.big_story_ref_type as 'alert' | 'intel') ?? 'alert', ref_id: n.big_story_ref_id as string, title: (n.big_story_title as string) ?? null, used_at: usedAt, source_ref: src })
    if (n.sweet_spot_ref_id)
      entries.push({ channel: 'sweet_spot', ref_type: (n.sweet_spot_ref_type as 'alert' | 'intel') ?? 'alert', ref_id: n.sweet_spot_ref_id as string, used_at: usedAt, source_ref: src })
    if (n.jills_take_ref_id)
      entries.push({ channel: 'jills_take', ref_type: 'alert', ref_id: n.jills_take_ref_id as string, used_at: usedAt, source_ref: src })
  }

  const { data: rems } = await supabase
    .from('reminders')
    .select('id, title, link, created_at, completed_at')
    .ilike('title', '%ocial post%')
  for (const r of rems ?? []) {
    const slug = ((r.link as string) || '').match(/\/alerts\/([^/?#]+)/)?.[1] ?? null
    if (!slug) continue
    const title = ((r.title as string) || '').replace(/^(Last-chance\s+)?social post( before it ends)?:\s*/i, '').trim()
    entries.push({ channel: 'social', ref_type: 'alert', ref_slug: slug, title, used_at: (r.completed_at as string) || (r.created_at as string), source_ref: `rem:${r.id}` })
  }

  return logContentUsage(supabase, entries)
}

export interface RecentUsage {
  channel: string
  ref_id: string | null
  ref_slug: string | null
  title: string | null
  used_at: string
}

export async function getRecentlyUsed(
  supabase: SupabaseClient,
  opts: { channels?: UsageChannel[]; sinceDays?: number } = {},
): Promise<RecentUsage[]> {
  const sinceIso = new Date(Date.now() - (opts.sinceDays ?? 60) * 86_400_000).toISOString()
  let q = supabase
    .from('content_usage')
    .select('channel, ref_id, ref_slug, title, used_at')
    .gte('used_at', sinceIso)
    .order('used_at', { ascending: false })
  if (opts.channels?.length) q = q.in('channel', opts.channels)
  const { data } = await q
  return (data ?? []) as RecentUsage[]
}
