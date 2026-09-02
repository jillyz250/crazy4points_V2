/**
 * Auto-clear the intel triage queue of items that provably need NO human decision,
 * so the Phase 4 queue can't silently accumulate (Jill, 2026-09-02: un-triaged
 * forwards had piled to 143 undecided). Three safe, reversible buckets:
 *   1. COVERED  — already matches a published/expired alert (same guard as
 *      morning-triage-by-type).
 *   2. EXPIRED  — the item's own expires_at is in the past.
 *   3. AGED EMAIL — a forwarded promo email undecided > ageDays (default 30).
 * NEVER touches items flagged as an update to a live alert (`update_to_alert_id`):
 * those carry new facts and the snapshot's ALERT UPDATES feed filters on
 * rejected_at IS NULL, so clearing one would drop the update prompt.
 * The covered-check is kept in sync with scripts/morning-triage-by-type.mjs.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const STOP = new Set(('the a an and or for to of on in with your you get now new best ever up as by is are add adds added ' +
  'through before after via more per off up to from at into out over under this that these those has have will can').split(' '))
const toks = (s: string) => [...new Set((s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
  .filter((w) => w.length > 3 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, '')))]
const jaccard = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return 0
  const B = new Set(b); let inter = 0
  for (const t of a) if (B.has(t)) inter++
  return inter / (a.length + b.length - inter)
}

export type AutoclearResult = { undecided: number; expired: number; covered: number; aged_email: number; cleared: number }

export async function runAutoclear(
  db: SupabaseClient,
  opts: { apply?: boolean; ageDays?: number } = {},
): Promise<AutoclearResult> {
  const apply = opts.apply ?? false
  const ageDays = opts.ageDays ?? 30
  const now = new Date().toISOString()

  // Sweep both truly-undecided intel AND the RETIRED `newsletter_idea` bucket (Jill,
  // 2026-09-02: it had silently grown to 303 legacy parks). Future-dated, uncovered
  // items still survive — only expired/covered/aged are cleared.
  const { data: intel } = await db.from('intel_items')
    .select('id, headline, programs, source_type, created_at, expires_at')
    .is('rejected_at', null).is('archived_at', null).is('alert_id', null)
    .or('triage_decision.is.null,triage_decision.eq.newsletter_idea')
    .is('update_to_alert_id', null).limit(5000)

  const { data: pubRaw } = await db.from('content_variants')
    .select('title, status, topics(programs)')
    .eq('format', 'alert').in('status', ['published', 'expired', 'soft_rejected', 'rejected']).limit(2500)
  const rejSince = new Date(Date.now() - 60 * 864e5).toISOString()
  const { data: rejRaw } = await db.from('intel_items')
    .select('headline, programs, rejected_at').not('rejected_at', 'is', null).gte('rejected_at', rejSince).limit(3000)
  const pub = [
    ...(pubRaw ?? []).map((p: any) => ({ tokens: toks(p.title), programs: p.topics?.programs ?? [], strict: false, title: p.title })),
    ...(rejRaw ?? []).map((r: any) => ({ tokens: toks(r.headline), programs: Array.isArray(r.programs) ? r.programs : [], strict: true, title: r.headline })),
  ]
  const coveredBy = (item: any): string | null => {
    const it = toks(item.headline)
    const iprog: string[] = Array.isArray(item.programs) ? item.programs : []
    for (const p of pub) {
      const progOverlap = iprog.some((x) => p.programs.includes(x)) || iprog.some((x) => p.tokens.includes(x.replace(/-/g, ' ').split(' ')[0]))
      if (!progOverlap && iprog.length) continue
      if (jaccard(it, p.tokens) >= (p.strict ? 0.55 : 0.42)) return p.title
    }
    return null
  }

  const ageCutoff = Date.now() - ageDays * 864e5
  const clears: { id: string; reason: string }[] = []
  const counts = { expired: 0, covered: 0, aged_email: 0 }
  for (const r of intel ?? []) {
    if (r.expires_at && new Date(r.expires_at) < new Date(now)) { clears.push({ id: r.id, reason: `expired ${String(r.expires_at).slice(0, 10)}` }); counts.expired++; continue }
    const cov = coveredBy(r)
    if (cov) { clears.push({ id: r.id, reason: `already covered by "${cov.slice(0, 60)}"` }); counts.covered++; continue }
    if (r.source_type === 'email' && Date.parse(r.created_at) < ageCutoff) { clears.push({ id: r.id, reason: `aged-out email forward (>${ageDays}d)` }); counts.aged_email++; continue }
  }

  if (apply) {
    for (const c of clears) {
      await db.from('intel_items').update({ rejected_at: now, processed: true, rejected_reason: `auto-clear: ${c.reason}` }).eq('id', c.id)
    }
  }
  return { undecided: intel?.length ?? 0, ...counts, cleared: apply ? clears.length : 0 }
}
