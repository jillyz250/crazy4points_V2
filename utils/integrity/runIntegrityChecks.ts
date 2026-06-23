import type { SupabaseClient } from '@supabase/supabase-js'
import type { TransferPartnerRow } from '@/utils/supabase/queries'
import { bonusDaysRemaining } from '@/utils/programs/transferBonus'

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
  /** Optional explicit link target (e.g. a card extract page). When set, the
   *  dashboard links here instead of building a /programs/<slug> URL. */
  href?: string
  /** Optional label for the link cell when `href` is set (programSlug column). */
  label?: string
}

const KEBAB = /^[a-z0-9-]+$/
// A numeric ratio token anywhere in the string. Annotated ratios like
// "3:1 with 5K bonus per 60K block" or "1:1.65 (65% bonus through May 15)" are
// legitimate and pass; only ratios with NO numeric ratio at all are suspect.
const RATIO_TOKEN = /\d+(?:\.\d+)?\s*:\s*\d+(?:\.\d+)?/
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

function ratioStrings(row: TransferPartnerRow): string[] {
  if (Array.isArray(row.tiers) && row.tiers.length > 0) {
    return row.tiers.map((t) => t.ratio).filter((r): r is string => typeof r === 'string')
  }
  return typeof row.ratio === 'string' ? [row.ratio] : []
}

/**
 * Classify a row's ratio. Returns null when fine. Tiers of badness:
 *   - contains a numeric ratio token (incl. annotated)        -> OK
 *   - empty / draft marker ("tbd", "varies")                  -> draft_ratio (med)
 *   - non-numeric but has digits (e.g. "2,000 pts : 30 NZ$")  -> nonstandard_ratio (low, informational)
 *   - no digits at all                                        -> bad_ratio_format (high)
 */
function classifyRatio(row: TransferPartnerRow): { check: string; severity: IntegritySeverity } | null {
  const strs = ratioStrings(row)
  if (strs.length === 0) return { check: 'draft_ratio', severity: 'med' }
  if (strs.some((s) => RATIO_TOKEN.test(s))) return null
  const joined = strs.join(' ').trim().toLowerCase()
  if (DRAFT_MARKERS.has(joined)) return { check: 'draft_ratio', severity: 'med' }
  if (/\d/.test(joined)) return { check: 'nonstandard_ratio', severity: 'low' }
  return { check: 'bad_ratio_format', severity: 'high' }
}

/**
 * Welcome-bonus tier-shape checks. Catches the two failure modes behind the
 * 2026-06-18 Breeze bug (which rendered "Up to 100,000" for a real 50k offer):
 *
 *   1. double-count signature - bonus_amount holds the TOTAL and tiered_bonuses
 *      holds the COMPONENTS (they sum to bonus_amount, no echo), so the headline
 *      formatter adds them again. Convention: bonus_amount = the FIRST tier;
 *      tiered_bonuses = the ADDITIONAL unlocks only.
 *   2. malformed tier keys - a tier missing a numeric bonus_amount (the legacy
 *      { amount, window_days } shape instead of { bonus_amount, timeline_months }),
 *      which the card-page renderer reads as undefined and fails to display.
 *
 * Detection only - flags for review at /admin/data-integrity, never edits.
 */
async function checkWelcomeBonusTiers(supabase: SupabaseClient): Promise<IntegrityFinding[]> {
  const { data } = await supabase
    .from('credit_card_welcome_bonuses')
    .select('bonus_amount, tiered_bonuses, credit_cards!inner(slug, name, is_active)')
    .eq('is_current', true)
    .not('tiered_bonuses', 'is', null)

  const out: IntegrityFinding[] = []
  for (const r of (data ?? []) as Array<{
    bonus_amount: number | null
    tiered_bonuses: unknown
    credit_cards: { slug: string; name: string; is_active: boolean } | { slug: string; name: string; is_active: boolean }[]
  }>) {
    const card = Array.isArray(r.credit_cards) ? r.credit_cards[0] : r.credit_cards
    if (!card || !card.is_active) continue
    const tiers = Array.isArray(r.tiered_bonuses) ? (r.tiered_bonuses as Array<Record<string, unknown>>) : []
    if (tiers.length === 0) continue

    // CHECK: malformed tier keys (a tier with no numeric bonus_amount).
    const badKeyTiers = tiers.filter((t) => typeof t?.bonus_amount !== 'number')
    if (badKeyTiers.length > 0) {
      out.push({
        check: 'welcome_bonus_bad_tier_keys',
        severity: 'high',
        programSlug: null,
        detail: `Card "${card.name}" (${card.slug}): ${badKeyTiers.length} of ${tiers.length} tiered_bonuses items lack a numeric bonus_amount (legacy "amount"/"window_days" shape). The welcome-bonus breakdown won't render. Use { bonus_amount, spend_usd, timeline_months }.`,
      })
      continue
    }

    // CHECK: double-count signature.
    if (r.bonus_amount != null) {
      const amounts = tiers.map((t) => t.bonus_amount as number)
      const hasEcho = amounts.includes(r.bonus_amount)
      const sum = amounts.reduce((a, b) => a + b, 0)
      if (!hasEcho && sum === r.bonus_amount) {
        out.push({
          check: 'welcome_bonus_double_count',
          severity: 'high',
          programSlug: null,
          detail: `Card "${card.name}" (${card.slug}): tiered_bonuses sum (${sum.toLocaleString()}) equals bonus_amount (${r.bonus_amount.toLocaleString()}) with no echo tier - the headline will double-count to "Up to ${(r.bonus_amount * 2).toLocaleString()}". bonus_amount should be the FIRST tier; tiered_bonuses should be the ADDITIONAL unlocks only.`,
        })
      }
    }
  }
  return out
}

/**
 * Cards whose good_to_know prose was flagged for re-check after a welcome-bonus
 * change. Self-clears when the editor next saves the prose (or via the
 * "Mark reviewed" button on /admin/card-bonus-signals).
 */
async function checkGoodToKnowReview(supabase: SupabaseClient): Promise<IntegrityFinding[]> {
  const { data } = await supabase
    .from('credit_cards')
    .select('slug, name, good_to_know_review_reason')
    .not('good_to_know_review_at', 'is', null)
    .order('good_to_know_review_at', { ascending: true })
  return ((data ?? []) as Array<{ slug: string; name: string | null; good_to_know_review_reason: string | null }>).map((c) => ({
    check: 'good_to_know_stale',
    severity: 'med' as IntegritySeverity,
    programSlug: null,
    href: `/admin/cards/${c.slug}/extract`,
    label: c.slug,
    detail: `${c.name ?? c.slug}: ${c.good_to_know_review_reason ?? 'Welcome bonus changed; re-check the good_to_know prose.'}`,
  }))
}

/**
 * Transfer-bonus expiry heads-up. Bonus badges self-hide once their
 * bonus_end_date passes (see isBonusActive), so this is detection-only:
 *  - 'transfer_bonus_expired' (low): flag still true but the date passed -
 *    the badge is already gone; this just nudges a DB cleanup.
 *  - 'transfer_bonus_expiring' (low): ends within 3 days - your window to
 *    extend the date if the promo got prolonged, before it auto-hides.
 */
async function checkTransferBonusExpiry(supabase: SupabaseClient): Promise<IntegrityFinding[]> {
  const { data } = await supabase
    .from('programs')
    .select('slug, transfer_partners_outbound')
    .not('transfer_partners_outbound', 'is', null)
  const out: IntegrityFinding[] = []
  for (const p of (data ?? []) as ProgramRow[]) {
    for (const row of p.transfer_partners_outbound ?? []) {
      const days = bonusDaysRemaining(row)
      if (days === null) continue
      if (days < 0) {
        out.push({
          check: 'transfer_bonus_expired',
          severity: 'low',
          programSlug: p.slug,
          detail: `Bonus flag for "${row.from_slug}" is still set true but ended ${-days} day(s) ago (${row.bonus_end_date}). Badge already hidden; clear the flag when convenient.`,
        })
      } else if (days <= 3) {
        out.push({
          check: 'transfer_bonus_expiring',
          severity: 'low',
          programSlug: p.slug,
          detail: `Bonus for "${row.from_slug}" ends in ${days} day(s) (${row.bonus_end_date}) and will auto-hide after. Extend the end date if the promo was prolonged.`,
        })
      }
    }
  }
  return out
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
      // CHECK: impossible edge - a hotel/airline/loyalty program "transferring"
      // TO a credit-card currency. Currencies are sources, not destinations;
      // this is always a backwards/stale edge.
      if (target && p.type !== 'credit_card' && target.type === 'credit_card') {
        findings.push({
          check: 'impossible_edge',
          severity: 'high',
          programSlug: p.slug,
          detail: `Outbound to credit-card currency "${fromSlug}" is the wrong direction - currencies transfer INTO ${p.slug}, not out of it. Remove this edge.`,
        })
      }
      // CHECK: ratio format (annotated numeric ratios pass; see classifyRatio).
      if (p.is_active) {
        const rc = classifyRatio(row)
        if (rc) {
          const shown = typeof row.ratio === 'string' && row.ratio ? row.ratio : ratioStrings(row).join(' / ') || '(empty)'
          findings.push({
            check: rc.check,
            severity: rc.severity,
            programSlug: p.slug,
            detail: `Outbound to "${fromSlug}" has a ${rc.check === 'draft_ratio' ? 'draft/placeholder' : rc.check === 'nonstandard_ratio' ? 'non-standard (descriptive)' : 'non-numeric'} ratio "${shown}".`,
          })
        }
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

  // CHECK: welcome-bonus tier shape (double-count + malformed keys).
  findings.push(...(await checkWelcomeBonusTiers(supabase)))

  // CHECK: cards flagged for a good_to_know prose re-check (a welcome-bonus
  // change may have left the prose quoting an old figure). Set by the Apply
  // flow / re-extract; cleared when the editor next saves the prose.
  findings.push(...(await checkGoodToKnowReview(supabase)))

  // CHECK: transfer-bonus flags expiring soon / past their end date.
  findings.push(...(await checkTransferBonusExpiry(supabase)))

  // Sort: high -> med -> low, then by check, then slug.
  const rank: Record<IntegritySeverity, number> = { high: 0, med: 1, low: 2 }
  findings.sort((a, b) =>
    rank[a.severity] - rank[b.severity] || a.check.localeCompare(b.check) || (a.programSlug ?? '').localeCompare(b.programSlug ?? ''),
  )
  return findings
}
