/**
 * Pre-triage lint for pending_review alerts. READ-ONLY. Flags the three error
 * classes we hit on 2026-07-07:
 *   1. DUPE      - likely duplicate of an already-published alert (same program + title overlap)
 *   2. STALE     - expired offer window (alert end_date or terms/source dates already past)
 *   3. UNVERIFIED- transient availability language or bare award prices that need a verified source
 *
 * Run: npx tsx --env-file=.env.local scripts/lint-pending-alerts.ts
 * Logic is modular so it can later be lifted into the daily-brief pre-triage
 * or the admin edit-page fact-check chips.
 */
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const NOW = new Date()

const STOP = new Set(['the','a','an','and','or','for','to','of','in','on','with','by','up','off','get','now','your','you','through','from','plus','at','is','are'])
function tokens(s: string): Set<string> {
  return new Set((s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)))
}
function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = [...a].filter(x => b.has(x)).length
  const uni = new Set([...a, ...b]).size
  return uni ? inter / uni : 0
}

// crude date finder: returns the latest Date it can parse from a string, or null
const MONTHS = 'january february march april may june july august september october november december'.split(' ')
function latestDate(s: string): Date | null {
  if (!s) return null
  const found: Date[] = []
  // "28 June 2023" / "15 July 2026"
  for (const m of s.matchAll(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/g)) {
    const mi = MONTHS.indexOf(m[2].toLowerCase())
    if (mi >= 0) found.push(new Date(Date.UTC(+m[3], mi, +m[1])))
  }
  // "December 15, 2026" / "March 31, 2027"
  for (const m of s.matchAll(/\b([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\b/g)) {
    const mi = MONTHS.indexOf(m[1].toLowerCase())
    if (mi >= 0) found.push(new Date(Date.UTC(+m[3], mi, +m[2])))
  }
  // ISO 2026-07-15
  for (const m of s.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) found.push(new Date(Date.UTC(+m[1], +m[2]-1, +m[3])))
  return found.length ? new Date(Math.max(...found.map(d => d.getTime()))) : null
}

async function main() {
  const { data: pend } = await sb
    .from('alerts')
    .select('id, slug, title, summary, description, type, source_url, primary_program_id, start_date, end_date, created_at')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
  const pending = pend ?? []

  const { data: pub } = await sb
    .from('alerts')
    .select('id, title, primary_program_id, created_at, status')
    .in('status', ['published', 'expired'])
    .order('created_at', { ascending: false })
    .limit(1000)
  const published = pub ?? []

  const { data: progs } = await sb.from('programs').select('id, name')
  const progName = new Map((progs ?? []).map((p: any) => [p.id, p.name]))

  // verified_terms per pending alert (via topic->variant)
  const vtMap = new Map<string, string | null>()
  for (const a of pending) {
    const { data } = await sb
      .from('topics').select('content_variants(metadata)').eq('slug', a.slug).maybeSingle()
    const cv = (data as any)?.content_variants
    const meta = Array.isArray(cv) ? cv[0]?.metadata : cv?.metadata
    vtMap.set(a.id, (meta?.verified_terms as string) ?? null)
  }

  const TRANSIENT = /\b(wide[- ]open|right now|available now|wide open|selling out|going fast)\b/i
  const AWARD_PRICE = /\b\d{1,3}(,\d{3})+\s*(avios|miles|points)\b/i

  let flagged = 0
  for (const a of pending) {
    const flags: string[] = []

    // 1. DUPE — same primary program + title overlap vs published
    const at = tokens(a.title)
    const dupes = published
      .filter(p => p.primary_program_id && p.primary_program_id === a.primary_program_id)
      .map(p => ({ p, score: jaccard(at, tokens(p.title)) }))
      .filter(x => x.score >= 0.34)
      .sort((x, y) => y.score - x.score)
      .slice(0, 2)
    for (const d of dupes) flags.push(`DUPE ~${Math.round(d.score*100)}% vs published "${d.p.title.slice(0,55)}" (${String(d.p.created_at).slice(0,10)})`)

    // 2. STALE — alert end_date at/past today (compare date-only, UTC)
    const todayUTC = Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate())
    if (a.end_date) {
      const ed = new Date(a.end_date)
      const edUTC = Date.UTC(ed.getUTCFullYear(), ed.getUTCMonth(), ed.getUTCDate())
      if (edUTC < todayUTC) flags.push(`STALE end_date ${String(a.end_date).slice(0,10)} already passed`)
      else if (edUTC === todayUTC) flags.push(`EXPIRES TODAY end_date ${String(a.end_date).slice(0,10)} - last-chance, confirm still live before publishing`)
    }
    // verified_terms period end already past
    const vt = vtMap.get(a.id)
    if (vt) {
      for (const line of vt.split(/\n/)) {
        if (/\b(booking|travel|offer)\s*period/i.test(line)) {
          const d = latestDate(line)
          if (d && d < NOW) flags.push(`STALE terms line "${line.trim().slice(0,50)}" ends ${d.toISOString().slice(0,10)} (past)`)
        }
      }
      if (/\/[a-z]{2}-[a-z]{2}\//i.test(vt)) flags.push(`STALE terms reference a regional (/xx-yy/) URL - confirm it's the canonical offer page`)
    }
    // source_url year vs alert start year mismatch (>1yr)
    const srcYear = (a.source_url || '').match(/\/(20\d{2})\//)?.[1]
    const startYear = a.start_date ? String(a.start_date).slice(0,4) : null
    if (srcYear && startYear && Math.abs(+srcYear - +startYear) > 1) flags.push(`STALE source year ${srcYear} vs alert year ${startYear}`)

    // 3. UNVERIFIED — transient/availability language (high signal). A bare
    // award price is only flagged when it co-occurs with a transient phrase in
    // the SAME sentence (the "wide open right now from 70,000 Avios" pattern) -
    // a price alone is usually just the offer's own sourced amount, so we skip it.
    const body = `${a.summary || ''}\n${a.description || ''}`
    if (TRANSIENT.test(body)) flags.push(`UNVERIFIED transient phrase "${body.match(TRANSIENT)![0]}" - availability claims go stale, needs a live source`)
    for (const sent of body.split(/(?<=[.!?])\s+|\n+/)) {
      if (TRANSIENT.test(sent) && AWARD_PRICE.test(sent))
        flags.push(`UNVERIFIED price "${sent.match(AWARD_PRICE)![0]}" tied to an availability claim - verify or drop`)
    }

    if (flags.length) {
      flagged++
      console.log(`\n⚑ ${a.title.slice(0,72)}`)
      console.log(`   program: ${progName.get(a.primary_program_id) || 'none'} | type: ${a.type} | source: ${(a.source_url||'').slice(0,60)}`)
      for (const f of flags) console.log(`   - ${f}`)
    } else {
      console.log(`\n✓ ${a.title.slice(0,72)} — clean`)
    }
  }
  console.log(`\n----\n${pending.length} pending · ${flagged} flagged · ${pending.length - flagged} clean`)
}

main().catch(e => { console.error(e); process.exit(1) })
