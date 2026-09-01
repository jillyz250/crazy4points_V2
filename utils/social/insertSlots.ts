/**
 * Insert generated `suggested` slots into social_calendar with real dedup, so
 * conceptual repeats never pile up (e.g. the Chase Freedom recurring anchor AND a
 * "Chase Freedom Q4 categories" reminder). A candidate is dropped if, within ~30
 * days of its date, an existing OR already-accepted slot shares its dedupe_key or has
 * an overlapping topic signature. Also enforces exact idempotency by source_ref.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { topicSignature, signaturesOverlap } from '@/lib/socialCategories'

export type CandidateSlot = {
  post_date: string
  platform: string
  topic: string
  category: string
  source_type: string
  source_ref: string
  dedupe_key: string | null
  status: 'suggested'
  link_url: string | null
  notes: string | null
}

function daysApart(a: string, b: string): number {
  return Math.abs((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000)
}

export async function insertDeduped(
  db: SupabaseClient,
  candidates: CandidateSlot[],
): Promise<{ inserted: number; skipped: number }> {
  if (!candidates.length) return { inserted: 0, skipped: 0 }

  const dates = candidates.map((c) => c.post_date).sort()
  const lo = new Date(`${dates[0]}T00:00:00Z`); lo.setUTCDate(lo.getUTCDate() - 40)
  const hi = new Date(`${dates[dates.length - 1]}T00:00:00Z`); hi.setUTCDate(hi.getUTCDate() + 40)
  const { data: existing } = await db
    .from('social_calendar')
    .select('post_date, platform, topic, source_ref, dedupe_key')
    .gte('post_date', lo.toISOString().slice(0, 10))
    .lte('post_date', hi.toISOString().slice(0, 10))

  const exact = new Set((existing ?? []).map((r) => `${r.post_date}|${r.platform}|${r.source_ref}`))
  // Running list of things to compare against (existing + accepted this batch).
  const seen = (existing ?? []).map((r) => ({ date: r.post_date, ref: r.source_ref, key: r.dedupe_key, sig: topicSignature(r.topic) }))

  const fresh: CandidateSlot[] = []
  let skipped = 0
  for (const c of candidates) {
    if (exact.has(`${c.post_date}|${c.platform}|${c.source_ref}`)) { skipped++; continue }
    const csig = topicSignature(c.topic)
    const dupe = seen.some((s) =>
      s.ref !== c.source_ref &&
      daysApart(c.post_date, s.date) <= 30 &&
      ((c.dedupe_key && s.key && c.dedupe_key === s.key) || signaturesOverlap(csig, s.sig)),
    )
    if (dupe) { skipped++; continue }
    fresh.push(c)
    seen.push({ date: c.post_date, ref: c.source_ref, key: c.dedupe_key, sig: csig })
  }

  if (fresh.length) {
    const { error } = await db.from('social_calendar').insert(fresh)
    if (error) throw new Error(`social_calendar insert failed: ${error.message}`)
  }
  return { inserted: fresh.length, skipped }
}
