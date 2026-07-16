#!/usr/bin/env node
/**
 * morning-snapshot — one command that pulls everything the daily ritual needs.
 *
 * Prints a live report of every queue (counts + the actual NEW items to act on),
 * brief/digest status, and the fresh intel list used for the decision table and
 * the source gap-check. Read-only. Used by the `daily-ritual` skill.
 *
 * Usage:  node scripts/morning-snapshot.mjs
 *
 * Filters mirror app/admin/(protected)/page.tsx loadStats() exactly, so the
 * numbers here match the dashboard "Your day" board.
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

const nowIso = new Date().toISOString()
const since36 = new Date(Date.now() - 36 * 3600 * 1000).toISOString()
const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

async function count(build) {
  try { const { count } = await build(); return count ?? 0 } catch { return '?' }
}

// ---- Counts (mirror the dashboard) ----------------------------------------
const pendingReview = await count(() =>
  db.from('content_variants').select('id', { count: 'exact', head: true })
    .eq('status', 'needs_review').or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`))

const intelToTriage = await count(() =>
  db.from('intel_items').select('id', { count: 'exact', head: true })
    .eq('processed', false).is('rejected_at', null)
    .or('triage_decision.is.null,triage_decision.in.(approved,newsletter_idea)')
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
    .or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`))

const changeSignals = await count(() =>
  db.from('change_signals').select('id', { count: 'exact', head: true }).eq('status', 'new'))
const bonusSignals = await count(() =>
  db.from('card_bonus_signals').select('id', { count: 'exact', head: true }).eq('status', 'new'))
const proseReview = await count(() =>
  db.from('credit_cards').select('id', { count: 'exact', head: true }).not('good_to_know_review_at', 'is', null))
const refreshQueue = await count(() =>
  db.from('admin_refresh_queue').select('*', { count: 'exact', head: true }))

// ---- Brief / digest status -------------------------------------------------
let briefLine = 'no briefs found'
try {
  const { data } = await db.from('daily_briefs').select('brief_date, sent_at').order('brief_date', { ascending: false }).limit(1).maybeSingle()
  if (data) briefLine = `latest ${data.brief_date}${data.brief_date === todayET ? ' (TODAY — ready)' : ' (today not built yet)'}`
} catch {}

// ---- Pending drafts (needs_review) — the ready-to-publish queue -----------
let drafts = []
try {
  const { data } = await db.from('content_variants')
    .select('title, format, created_at, metadata')
    .eq('status', 'needs_review').or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`)
    .order('created_at', { ascending: false })
  drafts = data || []
} catch {}

// ---- Fresh intel (last 36h, still open) — for the decision table + gap-check
let freshIntel = []
try {
  const { data } = await db.from('intel_items')
    .select('headline, source_name, source_type, programs, confidence, alert_type, expires_at, created_at')
    .eq('processed', false).is('rejected_at', null).is('archived_at', null).is('triage_decision', null)
    .gte('created_at', since36).order('created_at', { ascending: false })
  freshIntel = data || []
} catch {}

// ---- Open change signals + bonus signals detail ---------------------------
let changeDetail = [], bonusDetail = []
try { const { data } = await db.from('change_signals').select('headline, program_slug, created_at').eq('status', 'new').order('created_at', { ascending: false }).limit(15); changeDetail = data || [] } catch {}
try { const { data } = await db.from('card_bonus_signals').select('card_slug, headline, created_at').eq('status', 'new').order('created_at', { ascending: false }).limit(15); bonusDetail = data || [] } catch {}

// ---- Render ----------------------------------------------------------------
const B = '─'.repeat(64)
console.log(B)
console.log(`MORNING SNAPSHOT  ${todayET} (ET)`)
console.log(`Daily brief: ${briefLine}`)
console.log(B)
console.log('QUEUE COUNTS (act highest-first):')
console.log(`  Pending drafts (needs_review) . ${pendingReview}   -> /admin/drafts?view=needs_review`)
console.log(`  Intel to triage (open) ........ ${intelToTriage}   -> /admin/triage`)
console.log(`  Transfer-data changes ......... ${changeSignals}   -> /admin/change-signals`)
console.log(`  Welcome-bonus changes ......... ${bonusSignals}   -> /admin/card-bonus-signals`)
console.log(`  Prose to re-check ............. ${proseReview}   -> /admin/card-bonus-signals`)
console.log(`  Refresh queue ................. ${refreshQueue}   -> /admin/refresh-queue`)

console.log('\n' + B)
console.log(`PENDING DRAFTS — ready to publish/reject (${drafts.length}):`)
if (!drafts.length) console.log('  (none)')
for (const d of drafts) {
  const hot = d.metadata?.editorial_scores?.is_hot ? ' [HOT]' : ''
  console.log(`  - ${(d.format || '?').padEnd(6)}${hot}  ${(d.title || '(untitled)').slice(0, 72)}`)
}

console.log('\n' + B)
console.log(`FRESH INTEL — last 36h, still needing a decision (${freshIntel.length}):`)
if (!freshIntel.length) console.log('  (none — queue clear)')
for (const r of freshIntel) {
  const progs = Array.isArray(r.programs) ? r.programs.join(',') : (r.programs || '')
  console.log(`  - [${(r.source_type || '?').padEnd(8)}|${(r.confidence || '?').padEnd(6)}] ${(r.headline || '').slice(0, 74)}`)
  console.log(`      src=${r.source_name || '?'}  type=${r.alert_type || '?'}  programs=[${progs}]  exp=${r.expires_at ? r.expires_at.slice(0, 10) : '-'}`)
}

if (changeDetail.length) {
  console.log('\n' + B); console.log(`OPEN TRANSFER-DATA CHANGE SIGNALS (${changeDetail.length}):`)
  for (const r of changeDetail) console.log(`  - [${r.program_slug || '?'}] ${(r.headline || '').slice(0, 74)}`)
}
if (bonusDetail.length) {
  console.log('\n' + B); console.log(`OPEN WELCOME-BONUS SIGNALS (${bonusDetail.length}):`)
  for (const r of bonusDetail) console.log(`  - [${r.card_slug || '?'}] ${(r.headline || '').slice(0, 74)}`)
}
console.log('\n' + B)
console.log('GAP-CHECK HINT: scan FRESH INTEL above — any deal caught only by a blog/')
console.log('aggregator/email whose program has no working official source (or whose')
console.log('official newsroom missed it) is a source gap. Propose adding/fixing it.')
console.log(B)
