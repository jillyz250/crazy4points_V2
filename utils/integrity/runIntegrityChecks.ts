import type { SupabaseClient } from '@supabase/supabase-js'
import type { TransferPartnerRow } from '@/utils/supabase/queries'

/**
 * Deterministic data-integrity checks for the program/transfer graph.
 *
 * This is the cheap "Layer 0" of the data-accuracy plan: pure SQL/JS structural
 * checks (no LLM, no web). It catches the classes of problem the 2026-06-04
 * audit surfaced - orphan/junk slugs, ratios in the wrong format, deprecated
 * duplicate rows, and currencies missing their flag - the moment they appear.
 *
 * Runs daily via /api/cron/data-integrity (emails a summary) and on-demand from
 * /admin/data-integrity. Detection only - never mutates data.
 */

export type IntegritySeverity = 'high' | 'med' | 'low'

export interface IntegrityFinding {
  check: string
  severity: IntegritySeverity
  programSlug: string | null
  detail: string
}

const KEBAB = /^[a-z0-9-]+$/
const RATIO = /^\d+(\.\d+)?:\d+(\.\d+)?$/
// Draft/placeholder ratios that are filtered at render but shouldn't sit in
// published data either. Kept in sync with TransferPartnersTable.
const DRAFT_MARKERS = new Set(['', '-', '—', 'unconfirmed', 'tbd', 'unknown', 'pending', 'n/a', 'na', 'verify', 'needs verification', 'varies'])

const CANONICAL_CURRENCY_SLUGS = new Set(['amex', 'chase', 'citi', 'bilt', 'wells-fargo', 'capital-one'])

interface ProgramRow {
  slug: string
  name: string | null
  type: string
  is_active: boolean
  is_transferable_currency: boolean | null
  transfer_partners_outbound: TransferPartnerRow[] | null
}

function ratioOk(row: TransferPartnerRow): boolean {
  if (Array.isArray(row.tiers) && row.tiers.length > 0) {
    return row.tiers.some((t) => typeof t.ratio === 'string' && RATIO.test(t.ratio.trim()))
  }
  return typeof row.ratio === 'string' && RATIO.test(row.ratio.trim())
}

export async function runIntegrityChecks(supabase: SupabaseClient): Promise<IntegrityFinding[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('slug, name, type, is_active, is_transferable_currency, transfer_partners_outbound')
  if (error) throw error

  const programs = (data ?? []) as ProgramRow[]
  const bySlug = new Map(programs.map((p) => [p.slug, p]))
  const findings: IntegrityFinding[] = []

  for (const p of programs) {
    const rows = p.transfer_partners_outbound ?? []
    if (!Array.isArray(rows) || rows.length === 0) {
      // CHECK: deprecated/dead row still holding transfer data (the dupe pattern).
      continue
    }

    // A dead (inactive) row that still carries outbound data is a landmine:
    // stale copy that any "all programs" scan can trip on.
    if (!p.is_active) {
      findings.push({
        check: 'dead_row_with_outbound',
        severity: 'med',
        programSlug: p.slug,
        detail: `Inactive program still holds ${rows.length} outbound rows (stale duplicate?). Repoint refs + delete, or reactivate.`,
      })
    }

    for (const row of rows) {
      const fromSlug = row.from_slug
      // CHECK: malformed slug (the junk pattern: underscores/uppercase).
      if (typeof fromSlug !== 'string' || !KEBAB.test(fromSlug)) {
        findings.push({
          check: 'malformed_slug',
          severity: 'high',
          programSlug: p.slug,
          detail: `Outbound from_slug "${fromSlug}" is not kebab-case. Junk/legacy slug.`,
        })
        continue
      }
      const target = bySlug.get(fromSlug)
      // CHECK: orphan slug (valid kebab but no program row -> dead link).
      if (!target) {
        findings.push({
          check: 'orphan_slug',
          severity: p.is_active ? 'high' : 'low',
          programSlug: p.slug,
          detail: `Outbound target "${fromSlug}" has no program row (renders as a dead link). Add a reference stub.`,
        })
      } else if (p.is_active && !target.is_active) {
        // CHECK: active program points to an inactive target (empty/404 page).
        findings.push({
          check: 'inactive_target',
          severity: 'med',
          programSlug: p.slug,
          detail: `Outbound target "${fromSlug}" exists but is inactive - link goes to an unpublished page.`,
        })
      }
      // CHECK: ratio not in N:M format (and not a known draft marker, which is
      // its own leak class).
      if (p.is_active && !ratioOk(row)) {
        const raw = typeof row.ratio === 'string' ? row.ratio.trim().toLowerCase() : ''
        const isDraft = DRAFT_MARKERS.has(raw)
        findings.push({
          check: isDraft ? 'draft_ratio' : 'bad_ratio_format',
          severity: isDraft ? 'med' : 'high',
          programSlug: p.slug,
          detail: `Outbound to "${fromSlug}" has ${isDraft ? 'a draft/placeholder' : 'a non-numeric'} ratio "${row.ratio}".`,
        })
      }
    }

    // CHECK: active credit_card with outbound but not flagged as a currency
    // (so it would mis-route in the listings). bank-of-america is the known
    // non-transferable exception.
    if (p.is_active && p.type === 'credit_card' && !p.is_transferable_currency && p.slug !== 'bank-of-america') {
      findings.push({
        check: 'currency_flag_missing',
        severity: 'med',
        programSlug: p.slug,
        detail: `Active credit_card has ${rows.length} transfer partners but is_transferable_currency is false.`,
      })
    }
  }

  // CHECK: a non-canonical row that looks like a duplicate of a canonical
  // currency (slug starts with a canonical slug + "-", e.g. amex-membership-rewards).
  for (const p of programs) {
    if (CANONICAL_CURRENCY_SLUGS.has(p.slug)) continue
    for (const c of CANONICAL_CURRENCY_SLUGS) {
      if (p.slug.startsWith(c + '-') || p.slug === c + '-rewards') {
        findings.push({
          check: 'possible_currency_dupe',
          severity: 'low',
          programSlug: p.slug,
          detail: `Slug resembles a duplicate of canonical currency "${c}". Confirm it isn't a deprecated dupe.`,
        })
        break
      }
    }
  }

  // Sort: high -> med -> low, then by check, then slug.
  const rank: Record<IntegritySeverity, number> = { high: 0, med: 1, low: 2 }
  findings.sort((a, b) =>
    rank[a.severity] - rank[b.severity] || a.check.localeCompare(b.check) || (a.programSlug ?? '').localeCompare(b.programSlug ?? ''),
  )
  return findings
}
