#!/usr/bin/env node
/**
 * seed-decisions — throwaway seed of a couple of sample PENDING proposals into
 * decision_log so /admin/decisions isn't empty for Jill to try Approve/Reject.
 * Idempotent-ish: skips inserting a row whose (employee_slug, target_label,
 * correlation_id) already exists so re-running doesn't duplicate.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const today = new Date().toISOString().slice(0, 10)

const samples = [
  {
    employee_slug: 'kesha-social',
    action: 'bulk_skip',
    stakes: 'low',
    mode: 'proposed',
    status: 'pending',
    target_type: 'experience_listing',
    target_label: '212 directory-noise experiences (non-NY)',
    reason: 'Low-stakes directory listings, not our NY audience — clearing them keeps the review queue focused on real features.',
    item_count: 212,
    correlation_id: today,
    actor: 'agent',
  },
  {
    employee_slug: 'priya-sources',
    action: 'resolve',
    stakes: 'low',
    mode: 'proposed',
    status: 'pending',
    target_type: 'drift',
    target_label: '8 drift flags',
    reason: 'Transient promo false-positives (promos never go on program pages) — safe to resolve so the drift queue stays honest.',
    item_count: 8,
    correlation_id: today,
    actor: 'agent',
  },
  {
    employee_slug: 'priya-sources',
    action: 'dismiss',
    stakes: 'low',
    mode: 'proposed',
    status: 'pending',
    target_type: 'reminder',
    target_label: 'Dead reminder: "check Spirit schedule open" (Spirit defunct)',
    reason: 'Spirit ceased operations — this recurring reminder can never resolve. Dismissing to stop the noise.',
    item_count: 1,
    correlation_id: today,
    actor: 'agent',
  },
]

for (const s of samples) {
  const { data: exists } = await db
    .from('decision_log')
    .select('id')
    .eq('employee_slug', s.employee_slug)
    .eq('target_label', s.target_label)
    .eq('correlation_id', s.correlation_id)
    .maybeSingle()
  if (exists) {
    console.log(`skip (exists): ${s.employee_slug} — ${s.target_label}`)
    continue
  }
  const { error } = await db.from('decision_log').insert(s)
  if (error) { console.error(`FAILED ${s.employee_slug}: ${error.message}`); process.exit(1) }
  console.log(`seeded: ${s.employee_slug} — ${s.action} — ${s.target_label}`)
}

const { count } = await db.from('decision_log').select('*', { count: 'exact', head: true }).eq('status', 'pending')
console.log(`\ndecision_log pending rows: ${count}`)
