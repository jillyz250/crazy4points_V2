#!/usr/bin/env node
/**
 * Audits which migrations in supabase/migrations/ are actually present in prod.
 *
 * Probes specific tables/columns introduced by each migration. APPLIED if found,
 * MISSING if not. Run before Phase 0.5 to discover every ghost migration.
 *
 * Run: node scripts/audit-prod-migrations.mjs
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

try {
  const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(url, key)

// Each entry: { migration: '297', kind: 'table' | 'column', target: 'table_name' | 'table.column' }
// Probes are deliberately narrow — one quick check per migration.
// Probe targets verified 2026-05-20 against actual migration file contents.
const PROBES = [
  { migration: '280', kind: 'column', target: 'credit_cards.guide_to_benefits_url' },
  { migration: '281', kind: 'column', target: 'credit_cards.pricing_terms_url' },
  { migration: '282', kind: 'column', target: 'credit_cards.rotating_categories_url' },
  { migration: '283', kind: 'column', target: 'credit_cards.manual_overrides' },
  { migration: '284', kind: 'view', target: 'admin_refresh_queue' }, // recreates the view; later migrations also touch it
  { migration: '285', kind: 'table', target: 'cron_runs' },
  { migration: '286', kind: 'column', target: 'credit_card_extractions.markdown_hash' },
  { migration: '287', kind: 'column', target: 'credit_cards.points_transferable_to_partners' },
  { migration: '288', kind: 'column', target: 'credit_card_benefits.verified_at' },
  { migration: '289', kind: 'skip', target: 'enum value semi_annual — requires pg_constraint introspection' },
  { migration: '290', kind: 'skip', target: 'ALTER COLUMN drop NOT NULL on credit_card_welcome_bonuses.spend_required_usd — not probe-able via PostgREST' },
  { migration: '291', kind: 'view', target: 'admin_refresh_queue' }, // recreates view (same as 284, 302)
  { migration: '292', kind: 'table', target: 'experience_programs' },
  { migration: '293', kind: 'rows', target: 'experience_programs' },
  { migration: '294', kind: 'rows', target: 'credit_card_experience_programs' }, // inserts junction rows
  { migration: '295', kind: 'column', target: 'credit_cards.closed_to_new_applicants' },
  { migration: '296', kind: 'column', target: 'credit_cards.requires_manual_paste' },
  { migration: '297', kind: 'table', target: 'topics' },
  { migration: '298', kind: 'table', target: 'content_variants' },
  { migration: '299', kind: 'skip', target: 'indexes on topics/content_variants — require pg_indexes introspection' },
  { migration: '300', kind: 'table', target: 'blog_posts' },
  { migration: '301', kind: 'column', target: 'programs.transfer_partners_outbound' },
  { migration: '302', kind: 'column', target: 'programs.transfer_partners_verified_at' },
  { migration: '303', kind: 'table', target: 'backup_snapshots' },
  { migration: '304', kind: 'column', target: 'intel_items.triage_decision' },
  { migration: '305', kind: 'skip', target: 'security_definer views — pg_views introspection needed' },
  { migration: '306', kind: 'skip', target: 'function security — pg_proc introspection needed' },
  { migration: '307', kind: 'skip', target: 'security_invoker force — pg_views introspection needed' },
  { migration: '308', kind: 'table', target: 'rate_limit_events' },
  { migration: '309', kind: 'column', target: 'credit_cards.benefits_human_curated' },
]

async function probeTable(name) {
  // .limit(1) without head:true hits the schema cache for real; head:true silently succeeds on ghosts
  const { error } = await sb.from(name).select('*').limit(1)
  if (!error) return 'APPLIED'
  if (error.message && error.message.includes('Could not find the table')) return 'MISSING'
  if (error.code === 'PGRST205') return 'MISSING'
  return `UNKNOWN (${error.message?.slice(0, 60) ?? error.code})`
}

async function probeColumn(tableCol) {
  const [table, col] = tableCol.split('.')
  const { error } = await sb.from(table).select(col).limit(1)
  if (!error) return 'APPLIED'
  if (error.message && error.message.includes('does not exist')) return 'MISSING'
  if (error.message && error.message.includes('Could not find the table')) return 'MISSING (parent table)'
  return `UNKNOWN (${error.message?.slice(0, 60) ?? error.code})`
}

async function probeRows(name) {
  const { data, error } = await sb.from(name).select('*').limit(1)
  if (error) return `MISSING (${error.message?.slice(0, 40)})`
  if (!data || data.length === 0) return 'TABLE EXISTS BUT EMPTY'
  // get exact count
  const { count } = await sb.from(name).select('*', { count: 'exact', head: false }).limit(0)
  return `APPLIED (${count ?? '?'} rows)`
}

console.log('\nPROD MIGRATION AUDIT — ' + new Date().toISOString())
console.log('='.repeat(78))

let missing = []
for (const p of PROBES) {
  let result
  if (p.kind === 'table') result = await probeTable(p.target)
  else if (p.kind === 'view') result = await probeTable(p.target) // views queryable same way as tables
  else if (p.kind === 'column') result = await probeColumn(p.target)
  else if (p.kind === 'rows') result = await probeRows(p.target)
  else if (p.kind === 'skip') result = 'SKIP (' + p.target + ')'
  else result = 'UNKNOWN PROBE KIND'

  const label = `  ${p.migration}: ${p.target}`.padEnd(60, '.')
  console.log(`${label} ${result}`)
  if (result.startsWith('MISSING')) missing.push(p.migration)
}

console.log('\n' + '='.repeat(78))
if (missing.length === 0) {
  console.log('All migrations 280-309 APPLIED in prod (or skipped).')
} else {
  console.log(`MISSING migrations (apply these in Phase 0.5): ${missing.join(', ')}`)
}
console.log('')
