/**
 * Auto-clear the content_ideas backlog of ideas that need no human — mirrors the
 * intel auto-clear (Jill, 2026-09-02: 770 unwritten ideas piled up). Three safe,
 * reversible buckets (sets status='dismissed'; flip back to 'new' to restore):
 *   1. COVERED — the idea's topic matches something we already PUBLISHED (a guide,
 *      a written blog, or an alert), so it's effectively done.
 *   2. STALE   — an unwritten idea older than `staleDays` (default 90), never acted on.
 *   3. DUPE    — near-identical to another idea we're keeping this pass.
 * Leaves the genuinely-fresh, uncovered, recent ideas for the by-pillar review.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { GUIDES } from '@/lib/guides'

const STOP = new Set(('the a an and or for to of on in with your you get now new best ever up as by is are add adds added ' +
  'through before after via more per off up to from at into out over under this that these those has have will can how ' +
  'what which why guide points miles card cards').split(' '))
const toks = (s: string) => [...new Set((s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
  .filter((w) => w.length > 3 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, '')))]
const jaccard = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return 0
  const B = new Set(b); let i = 0
  for (const t of a) if (B.has(t)) i++
  return i / (a.length + b.length - i)
}

export type IdeasClearResult = { considered: number; covered: number; stale: number; dupe: number; cleared: number; remaining: number }

export async function runContentIdeasAutoclear(
  db: SupabaseClient,
  opts: { apply?: boolean; staleDays?: number } = {},
): Promise<IdeasClearResult> {
  const apply = opts.apply ?? false
  const staleDays = opts.staleDays ?? 90
  const staleCut = Date.now() - staleDays * 864e5

  const { data: ideas } = await db.from('content_ideas')
    .select('id, title, created_at').in('status', ['new', 'idea_bank']).limit(5000)
  if (!ideas?.length) return { considered: 0, covered: 0, stale: 0, dupe: 0, cleared: 0, remaining: 0 }

  // Covered corpus: published guides + written/published blog ideas + published alerts.
  const { data: writtenIdeas } = await db.from('content_ideas').select('title').or('status.eq.published,written_at.not.is.null').limit(3000)
  const { data: alerts } = await db.from('content_variants').select('title').eq('format', 'alert').in('status', ['published', 'expired']).limit(3000)
  const corpus = [
    ...GUIDES.map((g) => toks(g.title)),
    ...(writtenIdeas ?? []).map((r: any) => toks(r.title)),
    ...(alerts ?? []).map((r: any) => toks(r.title)),
  ]
  const coveredBy = (sig: string[]) => corpus.some((c) => jaccard(sig, c) >= 0.6)

  const kept: string[][] = []
  const clears: { id: string; bucket: 'covered' | 'stale' | 'dupe' }[] = []
  for (const r of ideas) {
    const sig = toks(r.title)
    if (coveredBy(sig)) { clears.push({ id: r.id, bucket: 'covered' }); continue }
    if (Date.parse(r.created_at) < staleCut) { clears.push({ id: r.id, bucket: 'stale' }); continue }
    if (kept.some((k) => jaccard(sig, k) >= 0.6)) { clears.push({ id: r.id, bucket: 'dupe' }); continue }
    kept.push(sig)
  }

  const counts = { covered: 0, stale: 0, dupe: 0 }
  for (const c of clears) counts[c.bucket]++
  if (apply && clears.length) {
    const ids = clears.map((c) => c.id)
    for (let i = 0; i < ids.length; i += 100) {
      await db.from('content_ideas').update({ status: 'dismissed' }).in('id', ids.slice(i, i + 100))
    }
  }
  return { considered: ideas.length, ...counts, cleared: apply ? clears.length : 0, remaining: ideas.length - clears.length }
}
