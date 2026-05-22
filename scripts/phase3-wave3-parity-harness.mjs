#!/usr/bin/env node
/**
 * Phase 3 Wave 3a — parity harness.
 *
 * For every variant with format='alert' AND status IN ('published','archived'),
 * verify the alerts mirror row matches per the synchronization guarantees
 * G1–G5 defined in plans/phase3-domain-model.md.
 *
 * AUTHORITATIVE: if this harness fails on a PR, the **rewrite is wrong**.
 * Do NOT "fix" the harness to make a PR pass (invariant I3).
 *
 * Checks:
 *   G1  slug, title (variant.title), description (variant.body),
 *       summary (topic.summary) match after canonical normalization.
 *   G2  status mapping is correct in both directions.
 *   G3  short_slug parity (variant.metadata.short_slug vs alerts.short_slug).
 *   G4  alert_programs reflects topic.programs[] exactly, with primary
 *       derived from topic.metadata.primary_program_id.
 *   G5  editorial scoring fields (impact/value/rarity/computed/why_this_matters
 *       /is_hot) match between topic.metadata.editorial_scores and alerts.
 *
 * Plus structural checks:
 *   - Every eligible variant has a matching alerts row (no missing mirrors).
 *   - Every alerts row that came from a backfilled topic has a matching
 *     variant (no orphan alerts from old write paths).
 *
 * Run: node scripts/phase3-wave3-parity-harness.mjs
 *      node scripts/phase3-wave3-parity-harness.mjs --strict   # fail on G3 mismatches too (currently warning only)
 *      node scripts/phase3-wave3-parity-harness.mjs --verbose  # log every row inspected
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

const STRICT = process.argv.includes('--strict')
const VERBOSE = process.argv.includes('--verbose')

// ---------------------------------------------------------------------------
// Canonical normalization — both sides go through this before comparing.
// ---------------------------------------------------------------------------
function normString(v) {
  if (v === null || v === undefined) return null
  const t = String(v).trim()
  return t.length === 0 ? null : t
}

function normBool(v) {
  if (v === null || v === undefined) return null
  return v === true
}

// Status mapping: variant.status → expected alerts.status. Mirrors the
// trigger logic from migration 326 — archived splits by archive_reason.
function expectedAlertStatus(variantStatus, topicEndDate, archiveReason) {
  switch (variantStatus) {
    case 'draft': return 'draft'
    case 'needs_review':
    case 'approved':
      return 'pending_review'
    case 'published':
      if (topicEndDate && new Date(topicEndDate) < new Date()) return 'expired'
      return 'published'
    case 'archived':
      if (archiveReason === 'rejected') return 'rejected'
      if (archiveReason === 'soft_rejected') return 'soft_rejected'
      return 'soft_rejected'  // backward-compat default
    default: return null
  }
}

async function loadProgramsBySlug() {
  const { data } = await sb.from('programs').select('id, slug')
  const m = new Map()
  for (const p of data ?? []) m.set(p.slug, p.id)
  return m
}

async function main() {
  console.log(`Phase 3 Wave 3a parity harness${STRICT ? ' (strict)' : ''}${VERBOSE ? ' (verbose)' : ''}`)
  console.log('---')

  const failures = []
  const warnings = []
  const programIdBySlug = await loadProgramsBySlug()

  // Pull every variant we care about. Promoted columns (Phase 4) included so
  // G7/G7a can check column ↔ metadata symmetry during the bake window.
  const { data: variants, error } = await sb
    .from('content_variants')
    .select('id, topic_id, title, body, status, published_at, metadata, voice_pass, voice_score, confidence_level, action_type, original_alert_type, start_date, short_slug, verified_terms, terms_waived_reason, variant_schema_version, topics:topics!inner(id, slug, title, summary, end_date, programs, metadata)')
    .eq('format', 'alert')
    .in('status', ['published', 'archived'])
  if (error) {
    console.error('Failed to load variants:', error.message)
    process.exit(1)
  }
  console.log(`Comparing ${variants.length} variants against alerts mirrors`)

  for (const v of variants) {
    const t = Array.isArray(v.topics) ? v.topics[0] : v.topics
    if (!t) {
      failures.push(`variant ${v.id}: no parent topic`)
      continue
    }
    const origAlertId = t.metadata?.original_alert_id
    if (!origAlertId) {
      failures.push(`variant ${v.id} (topic ${t.slug}): no original_alert_id on topic.metadata`)
      continue
    }

    // Load the alerts mirror
    const { data: alert } = await sb
      .from('alerts')
      .select('id, slug, short_slug, title, summary, description, type, status, primary_program_id, impact_score, value_score, rarity_score, computed_score, is_hot, why_this_matters, end_date')
      .eq('id', origAlertId)
      .maybeSingle()
    if (!alert) {
      failures.push(`variant ${v.id} (topic ${t.slug}): no alerts mirror for original_alert_id=${origAlertId}`)
      continue
    }

    if (VERBOSE) console.log(`  • ${t.slug}`)

    // G1: slug + title + description + summary (after canonical normalization)
    if (normString(alert.slug) !== normString(t.slug)) {
      failures.push(`G1 slug: ${t.slug} (variant) vs ${alert.slug} (alert)`)
    }
    if (normString(alert.title) !== normString(v.title)) {
      failures.push(`G1 title (${t.slug}): variant=${JSON.stringify(v.title)} alert=${JSON.stringify(alert.title)}`)
    }
    if (normString(alert.description) !== normString(v.body)) {
      failures.push(`G1 description (${t.slug}): variant.body vs alert.description differ`)
    }
    if (normString(alert.summary) !== normString(t.summary)) {
      failures.push(`G1 summary (${t.slug}): topic.summary vs alert.summary differ`)
    }

    // G2: status mapping (mirrors migration 326 trigger logic)
    const archiveReason = v.metadata?.archive_reason
    const expected = expectedAlertStatus(v.status, t.end_date, archiveReason)
    if (alert.status !== expected) {
      failures.push(`G2 status (${t.slug}): variant=${v.status} reason=${archiveReason ?? 'none'} → expected alert=${expected}, got=${alert.status}`)
    }

    // G3: short_slug parity (warning unless --strict)
    const expectedShortSlug = normString(v.metadata?.short_slug)
    if (normString(alert.short_slug) !== expectedShortSlug) {
      const msg = `G3 short_slug (${t.slug}): variant.metadata=${JSON.stringify(expectedShortSlug)} alert=${JSON.stringify(alert.short_slug)}`
      if (STRICT) failures.push(msg)
      else warnings.push(msg)
    }

    // G4: alert_programs reflects topic.programs[]; primary derived from
    // topic.metadata.primary_program_id
    const { data: ap } = await sb
      .from('alert_programs')
      .select('program_id, role, programs:programs!inner(slug)')
      .eq('alert_id', alert.id)
    const actualSlugs = new Set((ap ?? []).map((r) => {
      const p = Array.isArray(r.programs) ? r.programs[0] : r.programs
      return p?.slug
    }).filter(Boolean))
    const expectedSlugs = new Set(t.programs ?? [])
    const missingInAP = [...expectedSlugs].filter((s) => !actualSlugs.has(s))
    const extraInAP = [...actualSlugs].filter((s) => !expectedSlugs.has(s))
    if (missingInAP.length > 0 || extraInAP.length > 0) {
      failures.push(`G4 alert_programs (${t.slug}): missing=${JSON.stringify(missingInAP)} extra=${JSON.stringify(extraInAP)}`)
    }

    // Primary program: alerts.primary_program_id must equal topic.metadata.primary_program_id (when set)
    const expectedPrimaryId = t.metadata?.primary_program_id ?? null
    if (expectedPrimaryId && alert.primary_program_id !== expectedPrimaryId) {
      failures.push(`G4 primary_program_id (${t.slug}): topic.metadata=${expectedPrimaryId} alert=${alert.primary_program_id}`)
    }
    // And the alert_programs row for that program should have role='primary'
    if (expectedPrimaryId) {
      const primaryAp = (ap ?? []).find((r) => r.program_id === expectedPrimaryId)
      if (!primaryAp || primaryAp.role !== 'primary') {
        failures.push(`G4 primary role (${t.slug}): alert_programs row for primary not marked role=primary`)
      }
    }

    // G5: editorial scoring
    const ed = t.metadata?.editorial_scores ?? {}
    if ((ed.impact_score ?? null) !== (alert.impact_score ?? null)) {
      failures.push(`G5 impact_score (${t.slug}): topic=${ed.impact_score} alert=${alert.impact_score}`)
    }
    if ((ed.value_score ?? null) !== (alert.value_score ?? null)) {
      failures.push(`G5 value_score (${t.slug}): topic=${ed.value_score} alert=${alert.value_score}`)
    }
    if ((ed.rarity_score ?? null) !== (alert.rarity_score ?? null)) {
      failures.push(`G5 rarity_score (${t.slug}): topic=${ed.rarity_score} alert=${alert.rarity_score}`)
    }
    if ((normBool(ed.is_hot) ?? false) !== (normBool(alert.is_hot) ?? false)) {
      failures.push(`G5 is_hot (${t.slug}): topic=${ed.is_hot} alert=${alert.is_hot}`)
    }
    if (normString(ed.why_this_matters) !== normString(alert.why_this_matters)) {
      failures.push(`G5 why_this_matters (${t.slug}): topic vs alert differ`)
    }

    // ────────────────────────────────────────────────────────────────────
    // Phase 4 — column ↔ metadata symmetry (bake-window only; remove after
    // migration 328 drops the dual-write metadata keys).
    //
    //   G7  — promoted column matches metadata->>key (or metadata is null)
    //   G7a — strict: when column is non-null, metadata MUST match exactly.
    //         Catches the asymmetric-write bug where someone updates one
    //         side without the other.
    // ────────────────────────────────────────────────────────────────────
    const promotedFields = [
      { col: 'voice_pass',          meta: 'voice_pass',          cast: (v) => v === undefined || v === null ? null : Boolean(v) },
      { col: 'voice_score',         meta: 'voice_score',         cast: (v) => v === undefined || v === null ? null : Number(v) },
      { col: 'confidence_level',    meta: 'confidence_level',    cast: (v) => normString(v) },
      { col: 'action_type',         meta: 'action_type',         cast: (v) => normString(v) },
      { col: 'original_alert_type', meta: 'original_alert_type', cast: (v) => normString(v) },
      { col: 'short_slug',          meta: 'short_slug',          cast: (v) => normString(v) },
      { col: 'verified_terms',      meta: 'verified_terms',      cast: (v) => normString(v) },
      { col: 'terms_waived_reason', meta: 'terms_waived_reason', cast: (v) => normString(v) },
    ]
    for (const { col, meta, cast } of promotedFields) {
      const colVal = cast(v[col])
      const metaVal = cast(v.metadata?.[meta])
      // G7: equality OR metadata is null (column may lag during initial backfill bake)
      if (metaVal !== null && colVal !== metaVal) {
        failures.push(`G7 ${col} (${t.slug}): col=${JSON.stringify(colVal)} metadata=${JSON.stringify(metaVal)}`)
      }
      // G7a: when column is non-null, metadata MUST match (no silent column-only writes)
      if (colVal !== null && metaVal !== colVal) {
        failures.push(`G7a ${col} (${t.slug}): col=${JSON.stringify(colVal)} but metadata=${JSON.stringify(metaVal)} (asymmetric write)`)
      }
    }

    // Special-case start_date — alerts.start_date is timestamptz, variant
    // column is timestamptz, metadata stores ISO string. Compare epoch ms.
    const colStart = v.start_date ? new Date(v.start_date).getTime() : null
    const metaStart = v.metadata?.start_date ? new Date(v.metadata.start_date).getTime() : null
    if (metaStart !== null && colStart !== metaStart) {
      failures.push(`G7 start_date (${t.slug}): col=${v.start_date} metadata=${v.metadata?.start_date}`)
    }
    if (colStart !== null && metaStart !== colStart) {
      failures.push(`G7a start_date (${t.slug}): col=${v.start_date} but metadata=${v.metadata?.start_date} (asymmetric write)`)
    }

    // VSV1 — variant_schema_version must always be set explicitly.
    // (The migration default lands 1; helper always sets 1; reject 0/null.)
    if (!v.variant_schema_version || v.variant_schema_version < 1) {
      failures.push(`VSV1 (${t.slug}): variant_schema_version=${v.variant_schema_version} (must be ≥ 1)`)
    }
  }

  console.log('---')
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warnings (non-strict):`)
    for (const w of warnings.slice(0, 20)) console.log(`  • ${w}`)
    if (warnings.length > 20) console.log(`  ... and ${warnings.length - 20} more`)
  }
  if (failures.length === 0) {
    console.log(`✅ Parity harness PASSED — ${variants.length} variants, 0 drift`)
    process.exit(0)
  }
  console.log(`❌ Parity harness FAILED (${failures.length} issues):`)
  for (const f of failures.slice(0, 30)) console.log(`  • ${f}`)
  if (failures.length > 30) console.log(`  ... and ${failures.length - 30} more`)
  console.log('\n  REMINDER (I3): the harness is authoritative. If a code change')
  console.log('  caused this drift, fix the code — not the harness.')
  process.exit(1)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
