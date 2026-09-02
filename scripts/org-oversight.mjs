#!/usr/bin/env node
/**
 * org-oversight — Morgan's team read (Jill, 2026-09-02). Rolls up the org from Supabase
 * so the Chief of Staff can report straight on how the company is running: who's active
 * vs planned, what work is ASSIGNED-but-not-moving, and who has recent activity vs is
 * idle. Morgan narrates from this; it's her recurring oversight rail (feeds daily reports).
 * Run: node scripts/org-oversight.mjs
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const arr = (v) => (Array.isArray(v) ? v : [])

const { data: emps } = await db.from('employees')
  .select('id, slug, name, role_title, kind, status, responsibilities')
const { data: logs } = await db.from('employee_logs').select('employee_id, type, note, created_at')
const logsBy = {}
for (const l of logs || []) (logsBy[l.employee_id] ||= []).push(l)

const heads = (emps || []).filter((e) => e.kind === 'agent')
const active = heads.filter((e) => e.status === 'active')
const planned = heads.filter((e) => e.status === 'planned')

console.log('════════ MORGAN — TEAM OVERSIGHT ════════')
console.log(`Company: ${(emps || []).length} on the org · ${active.length} head(s) HIRED, ${planned.length} planned\n`)

// Open assignments (committed-but-not-started work), parsed from responsibilities
console.log('📋 OPEN ASSIGNMENTS (committed, not yet done):')
let openCount = 0
for (const e of heads) {
  const assigned = arr(e.responsibilities).filter((r) => /ASSIGNED/i.test(r))
  for (const a of assigned) {
    openCount++
    console.log(`   • ${e.name} (${e.status}): ${a.replace(/ASSIGNED[^:]*:\s*/i, '').slice(0, 100)}`)
  }
}
if (!openCount) console.log('   (none)')

// Activity: who's producing (has logs) vs idle
console.log('\n🔎 ACTIVITY:')
for (const e of active) {
  const n = (logsBy[e.id] || []).length
  const last = (logsBy[e.id] || []).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0]
  console.log(`   ${e.name} (active): ${n} log entr${n === 1 ? 'y' : 'ies'}${last ? `, last "${last.note.slice(0, 50)}..."` : ' — NO activity logged'}`)
}
for (const e of planned) console.log(`   ${e.name} (planned): not hired yet — ${arr(e.responsibilities).length} responsibilities defined, work is QUEUED not moving`)

// Morgan's flags
console.log('\n⚠️  MORGAN FLAGS:')
console.log(`   • ${planned.length} heads defined but not hired → ${openCount} assigned task(s) are queued with nobody to do them.`)
const idleActive = active.filter((e) => (logsBy[e.id] || []).length === 0)
if (idleActive.length) console.log(`   • Active but idle: ${idleActive.map((e) => e.name).join(', ')} — hired but no logged output.`)
console.log('\n(Morgan narrates the straight-talk read + recommendations from this.)')
