#!/usr/bin/env node
/**
 * improvement-radar — the zero-API scanner that powers the daily-ritual's
 * "improve every day" engine (Phases 13-15). Read-only.
 *
 * It ranks the site's real gaps across data-integrity, content, and process, so
 * each morning the ritual can grab ONE concrete, verified improvement per phase
 * instead of eyeballing it. No Anthropic / Firecrawl calls — pure DB reads +
 * filesystem checks — so it's safe to run any time, including low-API windows.
 *
 * Usage:  node scripts/improvement-radar.mjs
 *
 * DESIGN NOTE (the traps this avoids):
 *  - supabase-js does NOT throw on a bad column — it resolves with an `error`.
 *    Every query goes through q(), which records failures and prints them LOUDLY.
 *    A failed query must never masquerade as "no gaps."
 *  - Count JSON array/object columns by ACTUAL length, never truthiness. An empty
 *    `[]` is truthy; on 2026-08-26 that turned "4 programs need reverify" into a
 *    phantom "133". len() below is the fix — use it for every array/object column.
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
async function q(label, builder) {
  const { data, error } = await builder
  if (error) {
    problems.push(`${label}: ${error.message}`)
    return []
  }
  return data ?? []
}

/** Length of a JSON array/object column — the empty-[]-is-truthy guard. */
const len = (o) => (Array.isArray(o) ? o.length : o && typeof o === 'object' ? Object.keys(o).length : 0)
const daysSince = (d) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : Infinity)

// Programs we weight highest when a page goes stale.
const TOP = new Set([
  'chase', 'amex', 'citi', 'capital-one', 'bilt', 'american-airlines', 'united', 'delta',
  'hyatt', 'world-of-hyatt', 'marriott-bonvoy', 'hilton', 'alaska', 'atmos',
])

async function main() {
  const programs = await q(
    'programs',
    db.from('programs')
      .select('slug,name,type,intro,sweet_spots,content_updated_at,reverify_source_url,transfer_partners_outbound')
      .eq('is_active', true),
  )
  const cards = await q('credit_cards', db.from('credit_cards').select('slug,name,official_url'))
  const findings = await q(
    'verification_findings',
    db.from('verification_findings').select('id,created_at').eq('status', 'new'),
  )
  const reminders = await q(
    'reminders',
    db.from('reminders').select('id,title,due_date').eq('status', 'open'),
  )

  // ---- DATA-INTEGRITY gaps (Phase 16) ----
  const needReverify = programs.filter((p) => len(p.transfer_partners_outbound) > 0 && !p.reverify_source_url)
  const authored = (p) => (p.intro && p.intro.trim()) || len(p.sweet_spots) > 0 || (typeof p.sweet_spots === 'string' && p.sweet_spots.trim())
  const stale90 = programs
    .filter((p) => p.content_updated_at && daysSince(p.content_updated_at) > 90)
    .sort((a, b) => (TOP.has(b.slug) - TOP.has(a.slug)) || daysSince(b.content_updated_at) - daysSince(a.content_updated_at))
  const missingDate = programs.filter((p) => !p.content_updated_at && authored(p))
  const cardsNoOfficial = cards.filter((c) => !c.official_url)
  const openFindings = findings.length
  const oldestFinding = findings.reduce((m, f) => Math.min(m, daysSince(f.created_at)), Infinity)

  // ---- CONTENT gaps (feeds Phase 12 + the sweet-spot agent) ----
  const noSweet = programs.filter((p) => !(typeof p.sweet_spots === 'string' && p.sweet_spots.trim()))

  // ---- PROCESS hygiene (Phase 15) ----
  const staleReminders = reminders.filter((r) => daysSince(r.due_date) > 14)
  const tmpScripts = fs.existsSync('scripts')
    ? fs.readdirSync('scripts').filter((f) => f.startsWith('_tmp'))
    : []

  const line = (n) => (typeof n === 'number' ? String(n) : n)
  const P = (arr, k = 'slug', n = 8) => arr.slice(0, n).map((x) => x[k]).join(', ') + (arr.length > n ? ` +${arr.length - n}` : '')

  console.log('\n════════ IMPROVEMENT RADAR ' + new Date().toISOString().slice(0, 10) + ' ════════')
  console.log(`(scanned ${programs.length} active programs, ${cards.length} cards — read-only, zero-API)`)

  console.log('\n🛡️  DATA-INTEGRITY (Phase 16) — ranked by blast radius')
  const di = [
    stale90.length && (() => { const t = stale90.filter((p) => TOP.has(p.slug)).length; return { n: stale90.length, msg: `program pages stale >90d${t ? ` (${t} TOP program${t === 1 ? '' : 's'})` : ''}`, ex: P(stale90) } })(),
    cardsNoOfficial.length && { n: cardsNoOfficial.length, msg: 'cards missing official_url (accuracy + dead-link risk)', ex: P(cardsNoOfficial) },
    missingDate.length && { n: missingDate.length, msg: 'authored program pages with NO content_updated_at (404 risk on SQL pages)', ex: P(missingDate) },
    openFindings && { n: openFindings, msg: `unresolved transfer-drift findings (oldest ${line(oldestFinding)}d)`, ex: '/admin/agents' },
    needReverify.length && { n: needReverify.length, msg: 'programs with outbound partners NOT enrolled in drift check (verify a roster source first, then enroll)', ex: P(needReverify) },
  ].filter(Boolean).sort((a, b) => b.n - a.n)
  di.forEach((d) => console.log(`   • ${String(d.n).padStart(3)} — ${d.msg}\n           ${d.ex}`))

  console.log('\n📝  CONTENT (Phase 12 / sweet-spot agent)')
  console.log(`   • ${noSweet.length} active programs with no sweet_spots authored → ${P(noSweet)}`)

  console.log('\n⚙️  PROCESS hygiene (Phase 15)')
  if (staleReminders.length) console.log(`   • ${staleReminders.length} reminders open >14d (triage or dismiss): ${staleReminders.slice(0, 5).map((r) => r.title.slice(0, 40)).join(' · ')}`)
  if (tmpScripts.length) console.log(`   • ${tmpScripts.length} leftover _tmp scripts in scripts/ (clean up): ${tmpScripts.join(', ')}`)
  if (!staleReminders.length && !tmpScripts.length) console.log('   • clean ✅')

  console.log('\n🎨  VISUAL/UX (Phase 17) — not DB-scannable; run the 375px overflow + tap-target sweep in the preview browser.')

  // Suggested single picks for the ritual to grab.
  console.log('\n⭐ TODAY’S TOP PICKS')
  if (di[0]) console.log(`   Data-integrity: ${di[0].n} ${di[0].msg}`)
  console.log(`   Process: ${tmpScripts.length ? `clean up ${tmpScripts.length} _tmp scripts` : staleReminders.length ? `triage ${staleReminders.length} stale reminders` : 'no hygiene debt — pick an automation from the backlog'}`)
  console.log('   Visual: run the mobile overflow sweep and fix the worst offender')

  if (problems.length) {
    console.log('\n!! QUERY PROBLEM(S) — numbers above may be wrong, FIX FIRST:')
    problems.forEach((p) => console.log('   - ' + p))
  }
  console.log('')
}
main()
