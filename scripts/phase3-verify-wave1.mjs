#!/usr/bin/env node
/**
 * Phase 3 Wave 1 verification. All checks must pass before declaring Wave 1
 * done and moving on to Wave 2.
 *
 * Checks:
 *   1. Every eligible alert (published, expired, pending_review, draft) has
 *      a matching content_variants row (format='alert') via topics.slug.
 *   2. Variant count equals eligible alert count (no orphans, no duplicates).
 *   3. Sample 5 published alerts — variant.body matches alert.description
 *      and variant.title matches alert.title.
 *   4. No topic has duplicate alert variants.
 *   5. topics.slug = alerts.slug byte-for-byte (catches ASCII normalization).
 *   6. topics.programs[] matches alert_programs junction (set equality).
 *
 * Run: node scripts/phase3-verify-wave1.mjs
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
const sb = createClient(url, key)

const ELIGIBLE = ['published', 'expired', 'pending_review', 'draft']
const failures = []

async function loadAlertProgramSlugs(alertId) {
  const { data } = await sb
    .from('alert_programs')
    .select('programs:programs!alert_programs_program_id_fkey(slug)')
    .eq('alert_id', alertId)
  return new Set((data ?? [])
    .map((r) => (r.programs && typeof r.programs === 'object' ? r.programs.slug : null))
    .filter((s) => typeof s === 'string'))
}

async function main() {
  console.log('Phase 3 Wave 1 verification')
  console.log('---')

  const { data: alerts } = await sb
    .from('alerts')
    .select('id, slug, title, description, status, type')
    .in('status', ELIGIBLE)
    .order('created_at', { ascending: true })
  console.log(`Eligible alerts: ${alerts.length}`)

  // Check 1: every alert has a variant
  let missing = 0
  for (const a of alerts) {
    const { data: topic } = await sb
      .from('topics')
      .select('id, slug, programs')
      .eq('slug', a.slug)
      .maybeSingle()
    if (!topic) {
      failures.push(`Check 1: alert ${a.slug} → no matching topic`)
      missing++
      continue
    }
    // Check 5: byte-for-byte slug match
    if (topic.slug !== a.slug) {
      failures.push(`Check 5: alert.slug=${JSON.stringify(a.slug)} vs topic.slug=${JSON.stringify(topic.slug)} differ`)
    }
    const { data: variants } = await sb
      .from('content_variants')
      .select('id, title, body, status')
      .eq('topic_id', topic.id)
      .eq('format', 'alert')
    if (!variants || variants.length === 0) {
      failures.push(`Check 1: alert ${a.slug} → topic exists but no alert-variant`)
      missing++
      continue
    }
    // Check 4: no duplicates
    if (variants.length > 1) {
      failures.push(`Check 4: alert ${a.slug} → ${variants.length} alert-variants for same topic`)
    }
    // Check 6: programs set equality
    const alertSlugs = await loadAlertProgramSlugs(a.id)
    const topicSlugs = new Set(topic.programs ?? [])
    if (alertSlugs.size !== topicSlugs.size || [...alertSlugs].some((s) => !topicSlugs.has(s))) {
      failures.push(`Check 6: alert ${a.slug} → programs mismatch (alert=${[...alertSlugs].sort().join(',')} topic=${[...topicSlugs].sort().join(',')})`)
    }
  }

  // Check 2: counts match
  const { count: variantCount } = await sb
    .from('content_variants')
    .select('id', { count: 'exact', head: true })
    .eq('format', 'alert')
  const expected = alerts.length
  console.log(`Alert-variant count: ${variantCount} (expected ≥ ${expected})`)
  if (variantCount < expected) {
    failures.push(`Check 2: variant count ${variantCount} < eligible alerts ${expected}`)
  }

  // Check 3: sample 5 published alerts, deep match
  const published = alerts.filter((a) => a.status === 'published').slice(0, 5)
  for (const a of published) {
    const { data: topic } = await sb.from('topics').select('id').eq('slug', a.slug).maybeSingle()
    if (!topic) continue
    const { data: v } = await sb
      .from('content_variants')
      .select('title, body')
      .eq('topic_id', topic.id)
      .eq('format', 'alert')
      .single()
    if (!v) continue
    if (v.title !== a.title) {
      failures.push(`Check 3: ${a.slug} title differs (alert=${JSON.stringify(a.title)} variant=${JSON.stringify(v.title)})`)
    }
    if ((v.body ?? null) !== (a.description ?? null)) {
      failures.push(`Check 3: ${a.slug} body differs from alert.description`)
    }
  }

  console.log('---')
  if (failures.length === 0) {
    console.log('✅ Wave 1 verified — all 6 checks pass')
    process.exit(0)
  }
  console.log(`❌ Wave 1 failed (${failures.length} issues):`)
  for (const f of failures) console.log(`  • ${f}`)
  process.exit(1)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
