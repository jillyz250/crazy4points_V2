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
// Real ET calendar day drives freshness/health (always honest). MORNING_DATE
// overrides only the DISPLAY/decision date (weekday, month-start, reminder
// "today") so the ritual can be dry-run for any date, e.g.
//   MORNING_DATE=2026-09-01 node scripts/morning-snapshot.mjs
const realTodayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
const todayET = (process.env.MORNING_DATE || realTodayET).trim()

// ---- Text helpers for the dupe/page checks --------------------------------
const STOP = new Set(['the', 'and', 'for', 'with', 'through', 'from', 'your', 'you', 'not', 'are', 'now', 'its', 'of', 'to', 'on', 'in', 'up', 'by', 'is', 'has', 'new', 'more', 'get', 'can', 'but', 'as', 'at', 'be', 'this', 'that', 'points', 'miles', 'bonus', 'rewards', 'card', 'offer', 'sale', 'program', 'launches', 'announce', 'announces', 'partnership', 'partner', 'members', 'member'])
const tok = (t) => new Set(((t || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter((w) => !STOP.has(w)))
const jac = (a, b) => { const i = [...a].filter((x) => b.has(x)).length; const u = new Set([...a, ...b]).size; return u ? i / u : 0 }

// ---- Deterministic classifiers for the ritual (flag-only; reject nothing) --
// Page-affecting = a fact that can make a program/card page WRONG, so it needs a
// page check even if we don't publish an alert (the page-accuracy guarantee).
const PAGE_AFFECTING = new Set(['devaluation', 'fee_change', 'program_change', 'partner_change', 'category_change', 'earn_rate_change', 'status_change', 'policy_change', 'signup_bonus'])
// US-signal = a hard, DETERMINISTIC guard: anything mentioning a US issuer / USD
// can never be collapsed as "non-US", no matter what an LLM guesses.
const usSignal = (t) => /\b(chase|amex|american express|citi|citibank|bank of america|bofa|barclays|capital one|wells fargo|u\.s\.|us-only|usd)\b|\$\s?\d/i.test(t || '')
const NONUS_ISSUER = /\b(dbs|ocbc|uob|hsbc|standard chartered|maybank|posb|scb|krisflyer|royal orchid|thai airways)\b/i
const RECURRING = /\b(monthly|buy points|buy miles|global getaways|mileage bargains|points sale|miles sale)\b/i

// ---- Counts (mirror the dashboard) ---------------------------------------
const pendingReview = (await q('count pending drafts', db.from('content_variants').select('id', { count: 'exact', head: true })
  .eq('status', 'needs_review').or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`))).count

// Match the admin dashboard exactly: only TRULY-undecided intel counts (a
// decided item — newsletter_idea/approved — has left the triage queue). Counting
// those too made the board read 207 while the dashboard correctly showed 162.
// "Needs triage" = UNDECIDED and still live. Do NOT gate on processed=false —
// email intel is flagged processed=true on ingest before any decision, so that
// gate silently hid ~600 undecided items from the ritual (found 2026-08-28). The
// reliable signal is triage_decision IS NULL, matching the /admin/triage "active"
// tab (rejected/archived/promoted excluded, not snoozed, unexpired).
const intelToTriage = (await q('count intel to triage', db.from('intel_items').select('id', { count: 'exact', head: true })
  .is('rejected_at', null).is('archived_at', null).is('alert_id', null)
  .is('triage_decision', null)
  .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
  .or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`))).count
// Oldest undecided item — a growing/aging backlog means the AI classifier
// (build-brief's planner) has stalled (usually low API), so intel isn't being
// sorted. Surface it in HEALTH so a pileup never hides behind "all clear" again.
const oldestUndecided = (await q('oldest undecided intel', db.from('intel_items')
  .select('created_at').is('rejected_at', null).is('archived_at', null).is('alert_id', null).is('triage_decision', null)
  .or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`)
  .order('created_at', { ascending: true }).limit(1))).data[0]
const triageOldestDays = oldestUndecided ? Math.floor((Date.now() - new Date(oldestUndecided.created_at).getTime()) / 86400000) : 0
const triageBacklogBad = (intelToTriage ?? 0) > 30 || triageOldestDays > 3

const changeSignals = (await q('count change signals', db.from('change_signals').select('id', { count: 'exact', head: true }).eq('status', 'new').or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`))).count
const bonusSignals = (await q('count bonus signals', db.from('card_bonus_signals').select('id', { count: 'exact', head: true }).eq('status', 'new'))).count
const proseReview = (await q('count prose review', db.from('credit_cards').select('id', { count: 'exact', head: true }).not('good_to_know_review_at', 'is', null))).count
const refreshQueue = (await q('count refresh queue', db.from('admin_refresh_queue').select('*', { count: 'exact', head: true }))).count

// ---- Brief status ---------------------------------------------------------
const briefRow = (await q('daily brief', db.from('daily_briefs').select('brief_date, sent_at').order('brief_date', { ascending: false }).limit(1))).data[0]
const briefLine = briefRow
  ? `latest ${briefRow.brief_date}${briefRow.brief_date === todayET ? ' (TODAY — ready)' : ' (today not built yet)'}`
  : 'no briefs found'

// ---- Overnight HEALTH — a failed cron must not look like "all clear" -------
const newestIntel = (await q('newest intel', db.from('intel_items').select('created_at').order('created_at', { ascending: false }).limit(1))).data[0]
const briefStaleDays = briefRow ? Math.round((new Date(realTodayET) - new Date(briefRow.brief_date)) / 864e5) : null
const scoutAgeHrs = newestIntel ? Math.round((Date.now() - new Date(newestIntel.created_at)) / 3600e3) : null
const dow = new Date(todayET + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long' })
const monthStart = todayET.slice(8, 10) === '01'
// Month-start fires the monthly award-sales roundup (bundle the recurring Qatar /
// Copa / Alaska Global Getaways / Miles & More sales into ONE newsletter roundup).
const weeklyTask = monthStart ? '1st of month ==> run the monthly "This Month\'s Award Sales" roundup'
  : dow === 'Thursday' ? 'Newsletter day' : dow === 'Friday' ? 'Refresh-queue re-verify' : null

// ---- Reminders (due today + overdue) — was invisible; dated tasks slipped ---
const remindersOpen = (await q('reminders', db.from('reminders')
  .select('title, due_date, status, link, kind').eq('status', 'open')
  .order('due_date', { ascending: true }))).data
// Bid-to-win "Bidding closes" reminders are auto-generated auction noise (10+/day)
// and we don't push auctions socially — keep them out of the actionable list.
const isAuctionRem = (r) => r.kind === 'experience' || /bidding closes/i.test(r.title || '') || /auction/i.test(r.link || '')
const remActionable = remindersOpen.filter((r) => !isAuctionRem(r))
const remExpired = remActionable.filter((r) => r.due_date && r.due_date < todayET)
const remToday = remActionable.filter((r) => r.due_date === todayET)
const remAuctionDue = remindersOpen.filter((r) => isAuctionRem(r) && r.due_date && r.due_date <= todayET)

// ---- Deals expiring within 48h — last-chance social candidates -------------
const in48Iso = new Date(Date.now() + 48 * 3600 * 1000).toISOString()
const expiringDeals = (await q('deals expiring 48h', db.from('alerts')
  .select('title, short_slug, end_date').eq('status', 'published')
  .not('end_date', 'is', null).gte('end_date', nowIso).lte('end_date', in48Iso)
  .order('end_date', { ascending: true }))).data

// ---- Experience / auction closings within 5 days (Phase 2 feature candidates)
const in5dIso = new Date(Date.now() + 5 * 86400 * 1000).toISOString()
const expClosings = (await q('experience closings 5d', db.from('experience_listings')
  .select('title, source_platform, current_bid, minimum_bid, points_required, close_date, detail_url')
  .eq('status', 'active').gte('close_date', nowIso).lte('close_date', in5dIso)
  .order('close_date', { ascending: true }))).data

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
/** Fresh-intel headline vs published/archived alerts — catches the morning
 *  re-forward flood (the same emails duplicating alerts we already shipped). */
function dupeHeadline(h) {
  const ht = tok(h || '')
  let best = null, bs = 0
  for (const s of settled) { const sc = jac(ht, tok(s.title)); if (sc > bs) { bs = sc; best = s } }
  return bs >= 0.4 ? { score: bs, match: best } : null
}

// ---- Fresh intel (last 36h, still open) -----------------------------------
const freshIntel = (await q('fresh intel', db.from('intel_items')
  .select('id, headline, source_name, source_type, programs, confidence, alert_type, expires_at, created_at, confirmation_count, confirming_sources')
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
  .or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`)
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

// ---- Experiences: new listings still open (surfaced in morning triage) ----
// close_date is a cutoff instant, so compare to now (not today) — mirrors the
// /experiences page + newsletter guard so an expired listing isn't counted.
const newExpCount = (await q('new experiences count', db.from('experience_listings')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'active').gte('first_seen_at', since36)
  .or(`close_date.is.null,close_date.gte.${nowIso}`))).count

// ---- Sweepstakes: post candidates, ranked by CONTENT + soonest end date ----
// Content score favours pure points/miles giveaways (Jill's best-performing
// social) and big prizes; ties break on soonest deadline (most urgent to post).
const sweeps = (await q('sweepstakes post candidates', db.from('sweepstakes')
  .select('program, title, prize, ends_at').eq('status', 'running').eq('posted_social', false))).data
const scoreSweep = (s) => {
  const p = (s.prize || s.title || '').toLowerCase(); let sc = 0
  if (/\bmile|\bpoint/.test(p)) sc += 3                                   // pure points/miles = top social
  if (/100,?000|250,?000|500,?000|1,?000,?000|million/.test(p)) sc += 2  // big number
  if (/flight|flyaway|first class|trip|vacation|getaway/.test(p)) sc += 1
  return sc
}
const sweepRanked = sweeps.map((s) => ({ ...s, sc: scoreSweep(s) }))
  .sort((a, b) => b.sc - a.sc || (a.ends_at || '9999').localeCompare(b.ends_at || '9999'))

// ══════════════════════════ RENDER ══════════════════════════
const B = '─'.repeat(66)
console.log(B)
console.log(`MORNING SNAPSHOT  ${todayET} (ET) · ${dow}${weeklyTask ? `  ==> WEEKLY: ${weeklyTask}` : ''}`)
console.log(B)
// STEP 0 — overnight health. A stale cron must shout, not hide as "all clear".
const briefFlag = briefStaleDays === 0 ? 'OK (today)' : `!! ${briefStaleDays}d STALE — cron may have failed`
const scoutFlag = scoutAgeHrs === null ? '!! no intel ever' : scoutAgeHrs <= 30 ? `OK (${scoutAgeHrs}h ago)` : `!! ${scoutAgeHrs}h ago — Scout may be down`
// Watcher health, promoted into HEALTH (2026-08-28, Jill): surface any
// experiences scrape that FAILED or returned empty in the last ~16h right here,
// so a watcher break can't hide down in the Experiences section. Auto-retries on
// the next 8h run; the coverage watchdog emails if a program goes >36h with none.
const sinceWatch = new Date(Date.now() - 16 * 3600e3).toISOString()
const watchRuns = (await q('watcher health', db.from('experience_scrape_runs')
  .select('program_slug, success, error_message, run_started_at')
  .gte('run_started_at', sinceWatch).eq('success', false)
  .order('run_started_at', { ascending: false }))).data
const badWatch = [...new Map((watchRuns || []).map((r) => [r.program_slug, r])).values()]
const watchFlag = badWatch.length
  ? `⚠️ ${badWatch.length} empty/failed: ${badWatch.map((r) => r.program_slug).join(', ')} — auto-retries next run; watchdog emails if >36h`
  : 'OK'
console.log('HEALTH (step 0):')
console.log(`  Daily brief . ${briefFlag}`)
console.log(`  Scout intel . ${scoutFlag}`)
console.log(`  Triage classifier . ${triageBacklogBad ? `⚠️ BACKLOG ${intelToTriage} undecided, oldest ${triageOldestDays}d — planner likely stalled (check API budget)` : 'OK'}`)
console.log(`  Watchers (experiences) . ${watchFlag}`)
console.log(B)
console.log('QUEUE COUNTS (act highest-first):')
console.log(`  Pending drafts (needs_review) . ${n(pendingReview)}   -> /admin/drafts?view=needs_review`)
console.log(`  Intel to triage (open) ........ ${n(intelToTriage)}   -> /admin/triage`)
console.log(`  Transfer-data changes ......... ${n(changeSignals)}   -> /admin/change-signals`)
console.log(`  Welcome-bonus changes ......... ${n(bonusSignals)}   -> /admin/card-bonus-signals`)
console.log(`  Prose to re-check ............. ${n(proseReview)}   -> /admin/card-bonus-signals`)
console.log(`  Refresh queue ................. ${n(refreshQueue)}   -> /admin/refresh-queue`)
console.log(`  New experiences (36h) ......... ${n(newExpCount)}   -> /experiences`)
console.log(`  Sweepstakes to post ........... ${n(sweeps.length)}   -> /admin/sweepstakes`)

// STEP 1/2 — loose ends + reminders. Dated tasks that were slipping past.
console.log('\n' + B)
console.log(`REMINDERS — due today (${remToday.length}) + overdue (${remExpired.length}):`)
if (!remToday.length && !remExpired.length) console.log('  (none — nothing dated needs you)')
for (const r of remToday) console.log(`  [TODAY  ] ${(r.title || '').slice(0, 74)}${r.link ? '  -> ' + r.link : ''}`)
for (const r of remExpired) console.log(`  [${r.due_date} ] ${(r.title || '').slice(0, 66)}${r.link ? '  -> ' + r.link : ''}`)
if (remExpired.length) console.log('  -> overdue: act if still live, else DISMISS (set status=done). Ended deals = dismiss.')
if (remAuctionDue.length) console.log(`  (+ ${remAuctionDue.length} bid-to-win auction reminders closing — low priority, not social; dismiss in bulk)`)

console.log('\n' + B)
console.log(`DEALS EXPIRING WITHIN 48h — last-chance social candidates (${expiringDeals.length}):`)
if (!expiringDeals.length) console.log('  (none)')
for (const d of expiringDeals) console.log(`  - ends ${d.end_date ? d.end_date.slice(0, 10) : '?'} · ${(d.title || '').slice(0, 60)}  -> /alerts/${d.short_slug || ''}`)

console.log('\n' + B)
console.log(`EXPERIENCE / AUCTION CLOSINGS — within 5 days (Phase 2 feature candidates) (${expClosings.length}):`)
if (!expClosings.length) console.log('  (none)')
for (const e of expClosings) {
  const pts = e.current_bid || e.minimum_bid || e.points_required
  const ptsStr = pts ? `${Number(pts).toLocaleString()} pts` : 'bid'
  console.log(`  - closes ${e.close_date ? e.close_date.slice(0, 10) : '?'} · ${ptsStr} · [${e.source_platform || '?'}] ${(e.title || '').slice(0, 52)}`)
}
if (expClosings.length) console.log('  -> read US-relevance from the title (NY/US audience); FEATURE the great ones (alert + social/newsletter), honest bid framing.')

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
let idupCount = 0
const dupeIds = []       // ids of items flagged LIKELY DUPE — for the ready reject command
const autoHandled = []   // flag-only collapse candidates (non-US / recurring-sale)
const pageAffFacts = []  // facts that must trigger a page check regardless of verdict
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
  // OFFICIAL = came straight from an issuer/program newsroom (source_type=official)
  // = high-trust, verify-lite. EXPIRED = past its own exp date, likely dead.
  const official = r.source_type === 'official' ? ' [OFFICIAL]' : ''
  const expd = r.expires_at && r.expires_at < nowIso ? ' [EXPIRED]' : ''
  // Deterministic markers. US-signal + new-program are HARD guards: they can
  // never be collapsed, no matter what the non-US / recurring hints say.
  const blob = `${r.headline} ${progs}`
  const us = usSignal(blob)
  const progList = Array.isArray(r.programs) ? r.programs : []
  const newProg = progList.some((p) => p && !progBySlug.has(p))
  const pageAff = PAGE_AFFECTING.has(r.alert_type)
  const nonUsCand = !us && NONUS_ISSUER.test(blob)
  const recurCand = !us && (r.alert_type === 'award_sale' || RECURRING.test(r.headline || ''))
  const collapsible = (nonUsCand || recurCand) && !us && !newProg && !pageAff
  const mk = `${pageAff ? ' 📄' : ''}${us ? ' 🇺🇸' : ''}${newProg ? ' 🆕' : ''}${collapsible ? (nonUsCand ? ' ⤵non-US?' : ' ⤵recurring?') : ''}`
  if (collapsible) autoHandled.push(`${nonUsCand ? 'non-US' : 'recurring'}: ${(r.headline || '').slice(0, 58)}`)
  if (pageAff) pageAffFacts.push(`[${r.alert_type}|${progs || '?'}] ${(r.headline || '').slice(0, 60)}`)
  console.log(`  - [${(r.source_type || '?').padEnd(8)}|${(r.confidence || '?').padEnd(6)}]${official}${expd} ${(r.headline || '').slice(0, 72)}${mk}${warn}${cc}`)
  const idup = dupeHeadline(r.headline)
  if (idup) { idupCount++; dupeIds.push(r.id); console.log(`      <<LIKELY DUPE ${(idup.score * 100).toFixed(0)}% of published: "${(idup.match.title || '').slice(0, 50)}">> — reject unless genuinely new`) }
  // id printed so triage decisions act on the EXACT row (never a re-derived
  // substring match — that once over-rejected 5 non-dupes). Feed to
  // scripts/triage-apply.mjs --reject/--newsletter/--snooze <id...>.
  console.log(`      id=${r.id}  src=${r.source_name || '?'}  type=${r.alert_type || '?'}  programs=[${progs}]  exp=${r.expires_at ? r.expires_at.slice(0, 10) : '-'}`)
}
if (idupCount) {
  console.log(`  >> ${idupCount} of ${freshIntel.length} look like DUPES of already-published alerts — bulk-reject those first, then triage the rest.`)
  console.log(`     REJECT ALL FLAGGED DUPES → node scripts/triage-apply.mjs --reject ${dupeIds.join(' ')} --reason "duplicate of live alert"`)
  console.log(`     (review the list first — flags are fuzzy; drop any genuinely-new item before running)`)
}
if (lowSignal) {
  console.log(`  NOTE: ${lowSignal} low-signal item(s) (confidence=low and/or no program).`)
  console.log('        Third-party affiliate blasts (point.me, newsletters) often hide the card')
  console.log('        name to force a click, so they cannot be tagged, cannot be deduped, and')
  console.log('        are not citable anyway (issuer sources only). Default: reject.')
}
if (autoHandled.length) {
  console.log(`  AUTO-HANDLED CANDIDATES (${autoHandled.length}) — FLAG-ONLY, reject nothing yet:`)
  for (const a of autoHandled) console.log(`     ⤵ ${a}`)
  console.log('     (US-signal 🇺🇸 + new-program 🆕 items are NEVER here — they stay above.)')
}
if (pageAffFacts.length) {
  console.log(`  📄 PAGE-AFFECTING FACTS (${pageAffFacts.length}) — check the tied page even if rejected/newsletter:`)
  for (const p of pageAffFacts) console.log(`     📄 ${p}`)
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
if (newExp.length) console.log('  -> marquee/points-redeemable ones = social candidate (Chase-transfer angle; be honest bid vs redeem). Public directory auto-refreshed.')
for (const r of lastRun) {
  if (r.success === false) console.log(`  !! ${r.program_slug} scrape UNHEALTHY (${r.error_message || '?'}) at ${(r.run_started_at || '').slice(5, 16)}`)
}

// ---- New EXPERIENCES TO REVIEW — Jill runs through ALL, alerts the good ones
// Every reviewable experience she hasn't LOOKED at yet (editorial_reviewed_at
// null), still bookable. Presale-only ticket listings (Citi/Amex access) are
// excluded; niche Marriott/Delta ticket Moments are kept so nothing points-
// redeemable is missed. Alert-worthy (dreamy + points-priced) sort to the top
// with a ⭐. Deciding one (ANY verdict, incl. skip) sets editorial_reviewed_at,
// clearing it from this list AND the /admin dashboard "to review" number. There
// is NO time window — an experience stays here until it has been looked at.
const isPresaleCat = (c) => ['entertainment', 'music', 'sports', 'music & film'].includes((c || '').trim().toLowerCase())
const DREAMY_EXP = /travel|culinar|dining|wellness|adventure|cruise|luxur|money/i
const revRaw = (await q('experiences to review', db.from('experience_listings')
  .select('title, program_slug, format, current_bid, points_required, category, location, close_date, first_seen_at')
  .eq('status', 'active')
  .is('editorial_reviewed_at', null)
  .or(`close_date.is.null,close_date.gte.${nowIso}`)
  .order('first_seen_at', { ascending: false })
  .limit(400))).data
const toReview = (revRaw || []).filter((e) => !isPresaleCat(e.category) || e.program_slug === 'marriott-bonvoy')
const worthy = (e) => DREAMY_EXP.test(e.category || '') && e.points_required != null
toReview.sort((a, b) => {
  if (worthy(a) !== worthy(b)) return worthy(a) ? -1 : 1
  const ca = a.close_date || '9999', cb = b.close_date || '9999'
  if (ca !== cb) return ca < cb ? -1 : 1
  return (b.first_seen_at || '') < (a.first_seen_at || '') ? -1 : 1
})
console.log('\n' + B)
console.log(`NEW EXPERIENCES TO REVIEW — look at each, alert on the good ones (${toReview.length}):`)
if (!toReview.length) console.log('  (all caught up — none to review)')
const SHOW_EXP = 30
for (const e of toReview.slice(0, SHOW_EXP)) {
  const star = worthy(e) ? '⭐' : '  '
  const when = e.close_date ? `closes ${String(e.close_date).slice(5, 10)}` : 'no deadline '
  const pts = e.points_required != null ? `${Math.round(e.points_required / 1000)}k` : (e.current_bid != null ? 'bid' : '—')
  console.log(`  ${star} [${when}] ${String(pts).padStart(5)} · ${e.program_slug} · ${(e.title || '').slice(0, 46)}`)
}
if (toReview.length > SHOW_EXP) console.log(`  ... +${toReview.length - SHOW_EXP} more`)
if (toReview.length) {
  console.log('  -> ⭐ = alert-worthy (dreamy + points-priced). Run through ALL: per one PUBLISH (full')
  console.log('     alert) / QUICK-TAKE (short) / SKIP. ANY verdict marks editorial_reviewed_at (looked')
  console.log('     at) and clears it from the dash number. Verify vs the official source before publishing.')
}

// ---- Newsletter-bucket items EXPIRING SOON — promote to an alert? ----------
// Items parked for the biweekly newsletter that carry a near deadline: surface
// them so a time-sensitive one can become an alert before it goes stale in the
// newsletter queue. Only those WITH an expires_at inside the next 10 days.
const nlSoonIso = new Date(Date.now() + 10 * 86_400_000).toISOString()
const nlExpiring = (await q('newsletter items expiring', db.from('intel_items')
  .select('headline, programs, expires_at, source_name')
  .eq('triage_decision', 'newsletter_idea')
  .is('archived_at', null).is('rejected_at', null)
  .not('expires_at', 'is', null)
  .gte('expires_at', nowIso).lte('expires_at', nlSoonIso)
  .order('expires_at', { ascending: true }).limit(10))).data
console.log('\n' + B)
console.log(`NEWSLETTER ITEMS EXPIRING SOON — promote to an alert? (${nlExpiring.length}):`)
if (!nlExpiring.length) console.log('  (none expiring in the next 10 days)')
for (const it of nlExpiring) {
  console.log(`  [exp ${String(it.expires_at).slice(5, 10)}] ${(it.headline || '').slice(0, 62)}`)
}
if (nlExpiring.length) console.log('  -> per one: PUBLISH now (before it expires) / keep for newsletter / REJECT.')

// ---- Recently covered (content_usage ledger) — don't repeat ----------------
// The running list of stories we've already published per channel. The newsletter
// builder auto-avoids reusing a recent headline/Sweet Spot/Jill's Take; this view
// is mainly so social picks don't repeat a recent post.
const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()
const usage = (await q('recently covered', db.from('content_usage')
  .select('channel, title, ref_slug, used_at')
  .gte('used_at', since30d)
  .order('used_at', { ascending: false })
  .limit(80))).data
const usedSocial = (usage || []).filter((u) => u.channel === 'social')
const usedHeads = (usage || []).filter((u) => u.channel === 'newsletter_headline')
console.log('\n' + B)
console.log("RECENTLY COVERED (last 30d) — don't repeat:")
console.log(`  social posts (${usedSocial.length}):`)
usedSocial.slice(0, 10).forEach((u) => console.log(`    ${String(u.used_at).slice(5, 10)} ${(u.title || u.ref_slug || '?').slice(0, 52)}`))
if (usedHeads.length) console.log(`  newsletter headlines (${usedHeads.length}) + Sweet Spots are auto-blocked from repeating in the builder`)

// ---- Sweepstakes post candidates (the daily social opportunity) ------------
console.log('\n' + B)
console.log(`SWEEPSTAKES — post candidates, ranked by content + soonest deadline (${sweeps.length} unposted):`)
if (!sweeps.length) console.log('  (none to post right now)')
for (const [i, s] of sweepRanked.slice(0, 6).entries()) {
  console.log(`  ${i === 0 ? '⭐' : ' -'} [${s.program}] ${(s.title || '').slice(0, 40)} | ${(s.prize || '?').slice(0, 30)} | ends ${s.ends_at || '-'}`)
}
if (sweeps.length) console.log('  -> ⭐ = best social pick (points/miles giveaways lead — Jill\'s best-performing format). Say "facebook post" to draft it.')

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
