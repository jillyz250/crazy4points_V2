import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Auto-complete reminders whose window has passed, so the morning ritual isn't
 * buried under a graveyard of dead "post before it ends" and "bidding closes"
 * reminders. Canonical logic shared by the nightly cron (apply=true) and the
 * manual `scripts/morning-reminders-sweep.mjs` preview.
 *
 * Completes (status -> 'done'), only when due_date is already PAST:
 *   - "Bidding closes …" / kind=experience / auction links  -> the auction closed
 *   - "… before it ends" reminders whose tied alert is NO LONGER live. SAFETY: a
 *     still-published alert with a future end_date keeps its reminder (deal's on).
 * KEEPS: evergreen "Social post: …" and any other real to-do the user set.
 */

type ReminderRow = { id: string; title: string | null; due_date: string | null; link: string | null; kind: string | null }

export interface SweepResult {
  pastDue: number
  kept: number
  completed: number
  items: Array<{ id: string; title: string; due_date: string; why: string }>
}

const isAuction = (r: ReminderRow) =>
  r.kind === 'experience' || /bidding closes/i.test(r.title || '') || /auction/i.test(r.link || '')
const isBeforeEnds = (r: ReminderRow) => /before it ends/i.test(r.title || '')
const slugOf = (link: string | null) => {
  const m = /\/alerts\/([^/?#]+)/.exec(link || '')
  return m ? m[1] : null
}

export async function sweepDeadReminders(
  supabase: SupabaseClient,
  opts: { apply?: boolean; todayET?: string } = {},
): Promise<SweepResult> {
  const apply = opts.apply ?? false
  const nowIso = new Date().toISOString()
  const todayET = (opts.todayET || new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })).trim()

  const { data: open } = await supabase
    .from('reminders')
    .select('id, title, due_date, link, kind')
    .eq('status', 'open')
  const past = ((open ?? []) as ReminderRow[]).filter((r) => r.due_date && r.due_date < todayET)

  // Alerts still live (published + future end_date) — their "before it ends"
  // reminders must NOT be swept even if the reminder's own date slipped past.
  const { data: liveAlerts } = await supabase
    .from('alerts')
    .select('short_slug, slug, end_date')
    .eq('status', 'published')
    .not('end_date', 'is', null)
    .gte('end_date', nowIso)
  const liveSlugs = new Set<string>()
  for (const a of (liveAlerts ?? []) as Array<{ short_slug: string | null; slug: string | null }>) {
    if (a.short_slug) liveSlugs.add(a.short_slug)
    if (a.slug) liveSlugs.add(a.slug)
  }

  const toComplete: Array<{ r: ReminderRow; why: string }> = []
  let kept = 0
  for (const r of past) {
    if (isAuction(r)) { toComplete.push({ r, why: 'auction closed' }); continue }
    if (isBeforeEnds(r)) {
      const s = slugOf(r.link)
      if (s && liveSlugs.has(s)) { kept++; continue } // deal still live — keep
      toComplete.push({ r, why: 'deal ended' }); continue
    }
    kept++ // evergreen "Social post:" / real to-do — keep
  }

  let completed = 0
  if (apply && toComplete.length) {
    const ids = toComplete.map(({ r }) => r.id)
    const { error } = await supabase.from('reminders').update({ status: 'done', completed_at: nowIso }).in('id', ids)
    if (!error) completed = ids.length
  }

  return {
    pastDue: past.length,
    kept,
    completed: apply ? completed : 0,
    items: toComplete.map(({ r, why }) => ({ id: r.id, title: (r.title || '').slice(0, 80), due_date: r.due_date || '', why })),
  }
}
