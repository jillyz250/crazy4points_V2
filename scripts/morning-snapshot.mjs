#!/usr/bin/env node
/**
 * morning-snapshot — one command that pulls everything the daily ritual needs.
 *
 * Prints every queue (counts + the actual items to act on), brief status, the
 * fresh-intel list, program-drift, and the auto source-gap check. Read-only.
 * Used by the `daily-ritual` skill.
 *
 * Usage:  node scripts/morning-snapshot.mjs
 *
 * DESIGN NOTE (learned the hard way, 2026-07-17): supabase-js does NOT throw on
 * a bad column name — it resolves with an `error` property. Swallowing that in a
 * try/catch silently returns an empty list, which looks identical to "queue is
 * clear" and produced two wrong morning tables. Every query therefore goes
 * through q(), which records failures and prints them LOUDLY at the end. Never
 * ignore the error field.
 *
 * Filters mirror app/admin/(protected)/page.tsx loadStats() and
 * /admin/program-drift so these numbers match the dashboard.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const problems = []
/** Run a query, surfacing (never swallowing) errors. Returns {data, count}. */
async function q(label, builder) {
  try {
    const { data, error, count } = await builder
    if (error) { problems.push(`${label} -> ${error.message}`); return { data: [], count: null } }
    return { data: data ?? [], count: count ?? (data?.length ?? 0) }
  } catch (e) {
    problems.push(`${label} -> threw: ${e?.message || e}`)
    return { data: [], count: null }
  }
}
const n = (v) => (v === null ? 'ERR' : v)

const nowIso = new Date().toISOString()
const since36 = new Date(Date.now() - 36 * 3600 * 1000).toISOString()
const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

// ---- Text helpers for the dupe/page checks --------------------------------
const STOP = new Set(['the', 'and', 'for', 'with', 'through', 'from', 'your', 'you', 'not', 'are', 'now', 'its', 'of', 'to', 'on', 'in', 'up', 'by', 'is', 'has', 'new', 'more', 'get', 'can', 'but', 'as', 'at', 'be', 'this', 'that', 'points', 'miles', 'bonus', 'rewards', 'card', 'offer', 'sale', 'program', 'launches', 'announce', 'announces', 'partnership', 'partner', 'members', 'member'])
const tok = (t) => new Set(((t || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter((w) => !STOP.has(w)))
const jac = (a, b) => { const i = [...a].filter((x) => b.has(x)).length; const u = new Set([...a, ...b]).size; return u ? i / u : 0 }

// ---- Counts (mirror the dashboard) ---------------------------------------
const pendingReview = (await q('count pending drafts', db.from('content_variants').select('id', { count: 'exact', head: true })
  .eq('status', 'needs_review').or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`))).count

const intelToTriage = (await q('count intel to triage', db.from('intel_items').select('id', { count: 'exact', head: true })
  .eq('processed', false).is('rejected_at', null)
  .or('triage_decision.is.null,triage_decision.in.(approved,newsletter_idea)')
  .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
  .or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`))).count

const changeSignals = (await q('count change signals', db.from('change_signals').select('id', { count: 'exact', head: true }).eq('status', 'new'))).count
const bonusSignals = (await q('count bonus signals', db.from('card_bonus_signals').select('id', { count: 'exact', head: true }).eq('status', 'new'))).count
const proseReview = (await q('count prose review', db.from('credit_cards').select('id', { count: 'exact', head: true }).not('good_to_know_review_at', 'is', null))).count
const refreshQueue = (await q('count refresh queue', db.from('admin_refresh_queue').select('*', { count: 'exact', head: true }))).count

// ---- Brief status ---------------------------------------------------------
const briefRow = (await q('daily brief', db.from('daily_briefs').select('brief_date, sent_at').order('brief_date', { ascending: false }).limit(1))).data[0]
const briefLine = briefRow
  ? `latest ${briefRow.brief_date}${briefRow.brief_date === todayET ? ' (TODAY — ready)' : ' (today not built yet)'}`
  : 'no briefs found'

// ---- All alert variants (60d) — powers drafts list + the DUPE check --------
const variants = (await q('alert variants 60d', db.from('content_variants')
  .select('title, status, created_at, updated_at, metadata, snoozed_until')
  .eq('format', 'alert').gte('created_at', new Date(Date.now() - 60 * 864e5).toISOString()))).data
const drafts = variants.filter((v) => v.status === 'needs_review' && (!v.snoozed_until || v.snoozed_until <= nowIso))
const settled = variants.filter((v) => v.status !== 'needs_review')
/** For each draft, best match among published/archived — catches re-drafted dupes. */
function dupeOf(draft) {
  const dt = tok(draft.title)
  let best = null, bs = 0
  for (const s of settled) { const sc = jac(dt, tok(s.title)); if (sc > bs) { bs = sc; best = s } }
  return bs >= 0.3 ? { score: bs, match: best } : null
}

// ---- Fresh intel (last 36h, still open) -----------------------------------
const freshIntel = (await q('fresh intel', db.from('intel_items')
  .select('headline, source_name, source_type, programs, confidence, alert_type, expires_at, created_at, confirmation_count, confirming_sources')
  .eq('processed', false).is('rejected_at', null).is('archived_at', null).is('triage_decision', null)
  .gte('created_at', since36).order('created_at', { ascending: false }))).data

// ---- Suppressed dupes (last 36h) — visibility, so dedup isn't a black box --
const dupes = (await q('suppressed dupes', db.from('intel_items')
  .select('headline, source_name, dup_of_intel_id, created_at')
  .not('dup_of_intel_id', 'is', null).gte('created_at', since36)
  .order('created_at', { ascending: false }).limit(10))).data
let dupeOriginal = new Map()
if (dupes.length) {
  const ids = [...new Set(dupes.map((d) => d.dup_of_intel_id))]
  const origs = (await q('dupe originals', db.from('intel_items').select('id, headline').in('id', ids))).data
  dupeOriginal = new Map(origs.map((o) => [o.id, o.headline]))
}

// ---- Alert UPDATES — Haiku found facts our published alert is missing ------
// This is the payoff of Layer 2: a "dupe" that actually improves an alert.
const updates = (await q('alert updates', db.from('intel_items')
  .select('headline, source_name, haiku_diff_summary, haiku_diff_categories, update_to_alert_id, created_at')
  .not('update_to_alert_id', 'is', null).is('rejected_at', null).is('archived_at', null)
  .eq('processed', false).order('created_at', { ascending: false }).limit(8))).data
let updateAlert = new Map()
if (updates.length) {
  const ids = [...new Set(updates.map((u) => u.update_to_alert_id))]
  const al = (await q('update alert titles', db.from('alerts').select('id, title').in('id', ids))).data
  updateAlert = new Map(al.map((a) => [a.id, a.title]))
}

// ---- Signals + refresh detail ---------------------------------------------
const changeDetail = (await q('change signal detail', db.from('change_signals')
  .select('summary, program_slug, signal_type, source_name, created_at').eq('status', 'new')
  .order('created_at', { ascending: false }).limit(15))).data
const bonusDetail = (await q('bonus signal detail', db.from('card_bonus_signals')
  .select('card_slug, card_name, summary, stored_amount, detected_amount, created_at').eq('status', 'new')
  .order('created_at', { ascending: false }).limit(15))).data
const refreshDetail = (await q('refresh queue detail', db.from('admin_refresh_queue')
  .select('entity_type, entity_name, age_days, last_verified').order('age_days', { ascending: false }).limit(5))).data

// ---- Program-fact drift (same filter as /admin/program-drift + digest) -----
const driftRes = await q('program drift', db.from('intel_items')
  .select('headline, conflict_field, conflict_summary, conflicts_program_id', { count: 'exact' })
  .not('conflicts_program_id', 'is', null).is('conflict_resolution', null).is('archived_at', null)
  .order('conflict_detected_at', { ascending: false }).limit(6))
const driftDetail = driftRes.data, driftCount = driftRes.count

// ---- Programs + sources (page-check + gap-check) ---------------------------
const programsAll = (await q('programs', db.from('programs').select('*'))).data
const progBySlug = new Map(programsAll.map((p) => [p.slug, p]))
const nameBySlug = new Map(programsAll.map((p) => [p.slug, p.name]))
const activeSources = (await q('active sources', db.from('sources').select('name').eq('is_active', true))).data

/**
 * PAGE CHECK: is this signal's fact already on the program page?
 * Distinctive tokens = signal summary minus the program's own name. If they
 * already appear in the page row, the signal is likely already handled.
 * (Caught YOTEL-already-on-Hilton, 2026-07-17.)
 */
function alreadyOnPage(summary, programSlug) {
  const prog = progBySlug.get(programSlug)
  if (!prog) return null
  const blob = JSON.stringify(prog).toLowerCase()
  const own = tok(prog.name || '')
  const distinctive = [...tok(summary)].filter((t) => !own.has(t) && t.length >= 4)
  if (!distinctive.length) return null
  const hits = distinctive.filter((t) => blob.includes(t))
  return { hits, ratio: hits.length / distinctive.length }
}

// ---- Source gap-check -----------------------------------------------------
let gaps = []
{
  const gapIntel = (await q('gap intel 14d', db.from('intel_items')
    .select('programs, source_type, source_name, headline').neq('source_type', 'official')
    .is('rejected_at', null).gte('created_at', new Date(Date.now() - 14 * 864e5).toISOString()))).data
  const srcTokens = new Set()
  for (const s of activeSources) for (const w of (s.name || '').toLowerCase().match(/[a-z]{3,}/g) || []) srcTokens.add(w)
  const GAP_STOP = new Set(['news', 'google', 'miles', 'rewards', 'points', 'airlines', 'airways', 'hotels', 'hotel', 'group', 'card', 'cards', 'program', 'club', 'plus', 'world', 'air', 'the', 'one', 'usa', 'and', 'for', 'new'])
  const KNOWN_COVERED = new Set(['atmos']) // joint programs covered by a differently-named newsroom
  const seen = new Map()
  for (const r of gapIntel) {
    for (const slug of (Array.isArray(r.programs) ? r.programs : [])) {
      if (KNOWN_COVERED.has(slug)) continue
      const nm = nameBySlug.get(slug); if (!nm) continue
      const toks = (nm.toLowerCase().match(/[a-z]{3,}/g) || []).filter((t) => !GAP_STOP.has(t))
      if (toks.length && toks.some((t) => srcTokens.has(t))) continue
      const g = seen.get(slug) || { name: nm, count: 0, ex: r.headline, src: r.source_name }
      g.count++; seen.set(slug, g)
    }
  }
  gaps = [...seen.entries()].map(([slug, g]) => ({ slug, ...g })).sort((a, b) => b.count - a.count).slice(0, 8)
}

// ══════════════════════════ RENDER ══════════════════════════
const B = '─'.repeat(66)
console.log(B)
console.log(`MORNING SNAPSHOT  ${todayET} (ET)`)
console.log(`Daily brief: ${briefLine}`)
console.log(B)
console.log('QUEUE COUNTS (act highest-first):')
console.log(`  Pending drafts (needs_review) . ${n(pendingReview)}   -> /admin/drafts?view=needs_review`)
console.log(`  Intel to triage (open) ........ ${n(intelToTriage)}   -> /admin/triage`)
console.log(`  Transfer-data changes ......... ${n(changeSignals)}   -> /admin/change-signals`)
console.log(`  Welcome-bonus changes ......... ${n(bonusSignals)}   -> /admin/card-bonus-signals`)
console.log(`  Prose to re-check ............. ${n(proseReview)}   -> /admin/card-bonus-signals`)
console.log(`  Refresh queue ................. ${n(refreshQueue)}   -> /admin/refresh-queue`)

console.log('\n' + B)
console.log(`PENDING DRAFTS — dupe-checked vs ${settled.length} published/archived (${drafts.length}):`)
if (!drafts.length) console.log('  (none)')
for (const d of drafts) {
  const dup = dupeOf(d)
  const tag = !dup ? 'NEW    ' : dup.score >= 0.5 ? `DUPE ${(dup.score * 100).toFixed(0)}%` : `similar ${(dup.score * 100).toFixed(0)}%`
  const hot = d.metadata?.editorial_scores?.is_hot ? ' [HOT]' : ''
  console.log(`  [${tag}]${hot} ${(d.title || '(untitled)').slice(0, 66)}`)
  if (dup) {
    const why = dup.match.metadata?.archive_reason ? `${dup.match.status}/${dup.match.metadata.archive_reason}` : dup.match.status
    console.log(`        ^ ${why}: ${(dup.match.title || '').slice(0, 62)}`)
  }
}

console.log('\n' + B)
console.log(`FRESH INTEL — last 36h, still needing a decision (${freshIntel.length}):`)
if (!freshIntel.length) console.log('  (none — queue clear)')
let lowSignal = 0
for (const r of freshIntel) {
  const progs = Array.isArray(r.programs) ? r.programs.join(',') : (r.programs || '')
  /**
   * Layer 2 dedup only runs when alert_type AND programs are both set
   * (see ingestItem.ts). Untagged intel therefore skips the dedup+Haiku-diff
   * safety net entirely and can be a duplicate of a published alert with
   * nothing flagging it. Say so out loud rather than letting it sit in the
   * table looking like a normal item.
   */
  const noProgram = !progs
  if (noProgram || r.confidence === 'low') lowSignal++
  const warn = noProgram ? '  <<NO PROGRAM: skipped dedup, may be a dupe>>' : ''
  const cc = (r.confirmation_count ?? 0) >= 2 ? `  [CONFIRMED by ${r.confirmation_count}: ${(r.confirming_sources || []).join(', ').slice(0, 50)}]` : ''
  console.log(`  - [${(r.source_type || '?').padEnd(8)}|${(r.confidence || '?').padEnd(6)}] ${(r.headline || '').slice(0, 74)}${warn}${cc}`)
  console.log(`      src=${r.source_name || '?'}  type=${r.alert_type || '?'}  programs=[${progs}]  exp=${r.expires_at ? r.expires_at.slice(0, 10) : '-'}`)
}
if (lowSignal) {
  console.log(`  NOTE: ${lowSignal} low-signal item(s) (confidence=low and/or no program).`)
  console.log('        Third-party affiliate blasts (point.me, newsletters) often hide the card')
  console.log('        name to force a click, so they cannot be tagged, cannot be deduped, and')
  console.log('        are not citable anyway (issuer sources only). Default: reject.')
}

console.log('\n' + B)
console.log(`ALERT UPDATES — new facts for an already-published alert (${updates.length}):`)
if (!updates.length) console.log('  (none)')
for (const u of updates) {
  console.log(`  - ${(u.headline || '').slice(0, 68)}`)
  console.log(`      updates: "${(updateAlert.get(u.update_to_alert_id) || '?').slice(0, 58)}"`)
  if (u.haiku_diff_summary) console.log(`      new facts: ${String(u.haiku_diff_summary).slice(0, 84)}`)
}
if (updates.length) console.log('  -> these IMPROVE a live alert. Verify, then edit the alert (do not publish a second one).')

console.log('\n' + B)
console.log(`SUPPRESSED DUPES — auto-hidden in the last 36h (${dupes.length}):`)
if (!dupes.length) console.log('  (none)')
for (const d of dupes) {
  console.log(`  - ${(d.headline || '').slice(0, 66)}  <${d.source_name || '?'}>`)
  console.log(`      dupe of: "${(dupeOriginal.get(d.dup_of_intel_id) || '(original not found)').slice(0, 58)}"`)
}

if (changeDetail.length) {
  console.log('\n' + B); console.log(`OPEN TRANSFER-DATA CHANGE SIGNALS (${changeDetail.length}) — page-checked:`)
  for (const r of changeDetail) {
    const chk = alreadyOnPage(r.summary, r.program_slug)
    const mark = !chk ? '' : chk.ratio >= 0.6 ? `  <<ALREADY ON PAGE? ${(chk.ratio * 100).toFixed(0)}% terms present>>` : chk.ratio >= 0.3 ? `  <partly on page ${(chk.ratio * 100).toFixed(0)}%>` : ''
    console.log(`  - [${r.program_slug || '?'}|${r.signal_type || '?'}] ${(r.summary || '').slice(0, 62)}${mark}`)
  }
  console.log('  NOTE: page-check is fuzzy — confirm on the page before dismissing.')
}
if (bonusDetail.length) {
  console.log('\n' + B); console.log(`OPEN WELCOME-BONUS SIGNALS (${bonusDetail.length}):`)
  for (const r of bonusDetail) console.log(`  - [${r.card_slug || '?'}] ${(r.summary || r.card_name || '').slice(0, 60)}  (ours ${r.stored_amount ?? '?'} vs live ${r.detected_amount ?? '?'})`)
}
if (refreshDetail.length) {
  console.log('\n' + B); console.log(`REFRESH QUEUE — oldest due (top ${refreshDetail.length} of ${n(refreshQueue)}):`)
  for (const r of refreshDetail) console.log(`  - [${(r.entity_type || '?').replace(/^program_/, '').replace(/_/g, ' ')}] ${(r.entity_name || '?').slice(0, 56)}  (${r.last_verified ? r.age_days + 'd' : 'never verified'})`)
}

console.log('\n' + B)
console.log(`PROGRAM-FACT DRIFT — fresh intel contradicts a program page (top ${driftDetail.length} of ${n(driftCount)}):`)
if (!driftDetail.length) console.log('  (none open — pages current)')
for (const d of driftDetail) console.log(`  - [${d.conflict_field || '?'}] ${(d.conflict_summary || d.headline || '').slice(0, 74)}`)
if (driftDetail.length) console.log('  -> verify vs issuer page, fix if real, resolve at /admin/program-drift')

console.log('\n' + B)
console.log(`SOURCE GAPS — programs in blog/email intel (14d) with NO matching active source (${gaps.length}):`)
if (!gaps.length) console.log('  (none flagged — coverage looks complete)')
for (const g of gaps) console.log(`  - ${g.name} (${g.slug}) x${g.count}  e.g. "${(g.ex || '').slice(0, 46)}" via ${g.src}`)
if (gaps.length) console.log('  NOTE: fuzzy name-match — verify (Firecrawl->Haiku) before adding.')

// ---- Experiences watch (new listings + scraper health) --------------------
const newExp = (await q('new experiences', db.from('experience_listings')
  .select('title, program_slug, format, current_bid, points_required, category, first_seen_at')
  .eq('status', 'active').gte('first_seen_at', since36).order('first_seen_at', { ascending: false }).limit(12))).data
const lastRun = (await q('experience runs', db.from('experience_scrape_runs')
  .select('program_slug, run_started_at, success, items_found, error_message')
  .order('run_started_at', { ascending: false }).limit(3))).data
console.log('\n' + B)
console.log(`EXPERIENCES — new listings since yesterday (${newExp.length}):`)
if (!newExp.length) console.log('  (none new)')
for (const e of newExp) {
  const pts = e.format === 'bid' ? `bid ${e.current_bid ?? '?'}` : `${e.points_required ?? '?'} pts`
  console.log(`  - [${e.program_slug}|${e.category || '?'}] ${(e.title || '').slice(0, 60)}  (${pts})`)
}
if (newExp.length) console.log('  -> marquee ones = social (Chase-transfer angle, honest it is a bid). Public directory auto-refreshed.')
for (const r of lastRun) {
  if (r.success === false) console.log(`  !! ${r.program_slug} scrape UNHEALTHY (${r.error_message || '?'}) at ${(r.run_started_at || '').slice(5, 16)}`)
}

if (problems.length) {
  console.log('\n' + '!'.repeat(66))
  console.log(`!! ${problems.length} QUERY PROBLEM(S) — SOME NUMBERS ABOVE ARE WRONG/MISSING:`)
  for (const p of problems) console.log(`   - ${p}`)
  console.log('!! Fix these before trusting the snapshot.')
  console.log('!'.repeat(66))
} else {
  console.log('\n' + B)
  console.log('All queries OK — no silent failures.')
  console.log(B)
}
