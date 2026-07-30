/**
 * Phase 3 Wave 2 — adapter that reconstructs the legacy `Alert` shape from
 * `content_variants` + `topics`. Consumer code keeps using the same shape;
 * only the underlying read changes.
 *
 * Why: every public read path that today queries `alerts` will route through
 * this adapter instead. Wave 1's dual-write trigger keeps both tables in
 * sync, so the adapter just exposes the new tables in the familiar shape.
 *
 * Normalizations:
 *   • programs[] and fact_ledger[] always return [], never null
 *     (alerts historically had inconsistent null semantics).
 *   • metadata.source = 'variants' on every returned row — debug marker so
 *     we can confirm in logs which read path served a request.
 *
 * Wave 3 will eventually rename this to the canonical type and drop the
 * `Alert` alias.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Alert, AlertProgram, Program } from '@/utils/supabase/queries'

export type AlertView = Alert & {
  /** Wave 2 provenance marker. Always 'variants' from this adapter. */
  _view_source?: 'variants'
  /**
   * When true, the alert publishes normally (alerts feed, program pages) but is
   * kept OFF the home-page hot-alerts bar. For niche / narrow-audience or
   * historical-record alerts that shouldn't take a prime banner slot. Sourced
   * from variant metadata `suppress_home_banner`.
   */
  suppress_home_banner?: boolean
}

/**
 * Same as AlertView plus the joined alert_programs shape callers like
 * AlertCard / AlertCardSB consume. Populate via the `withPrograms` filter.
 */
export type AlertViewWithPrograms = AlertView & {
  alert_programs: (AlertProgram & { programs: Program })[]
  programs: Program[]
}

/** Shape returned by the joined SELECT. Kept loose; mapped row-by-row. */
type VariantRow = {
  id: string
  topic_id: string
  title: string | null
  body: string | null
  status: string
  published_at: string | null
  publish_target_url: string | null
  archived_at: string | null
  brand_voice_run: boolean
  fact_check_run: boolean
  fact_check_results: unknown | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  topics: {
    id: string
    slug: string
    title: string
    summary: string | null
    topic_type: string
    source_urls: string[] | null
    fact_ledger: unknown[] | null
    end_date: string | null
    programs: string[] | null
    cards: string[] | null
    status: string
    created_by: string
    verified_at: string | null
    metadata: Record<string, unknown> | null
    created_at: string
    updated_at: string
  } | null
}

const SELECT_COLS = `
  id, topic_id, title, body, status, published_at, publish_target_url,
  archived_at, brand_voice_run, fact_check_run, fact_check_results, metadata,
  created_at, updated_at,
  topics:topics!inner(
    id, slug, title, summary, topic_type, source_urls, fact_ledger, end_date,
    programs, cards, status, created_by, verified_at, metadata,
    created_at, updated_at
  )
`

function pickString(meta: Record<string, unknown> | null | undefined, key: string): string | null {
  const v = meta?.[key]
  return typeof v === 'string' ? v : null
}

function pickBoolean(meta: Record<string, unknown> | null | undefined, key: string): boolean | null {
  const v = meta?.[key]
  return typeof v === 'boolean' ? v : null
}

function pickNumber(meta: Record<string, unknown> | null | undefined, key: string): number | null {
  const v = meta?.[key]
  return typeof v === 'number' ? v : null
}

/**
 * Map one joined variant+topic row to AlertView. Exported so raw-query call
 * sites that don't want to swap their SELECT can still get the right shape.
 */
export function mapVariantRowToAlertView(row: VariantRow): AlertView {
  const t = row.topics
  const variantMeta = row.metadata ?? {}
  const topicMeta = t?.metadata ?? {}
  const editorialScores = (topicMeta.editorial_scores ?? {}) as Record<string, unknown>

  // Status: variant status maps back to alert status. Inverse of Wave 1 mapping.
  const variantStatus = row.status
  const alertStatus = variantStatus === 'needs_review'
    ? 'pending_review'
    : variantStatus === 'archived'
      ? 'soft_rejected'
      : variantStatus  // 'draft' | 'published'

  // Original alert id is preserved on every topic (Wave 1 backfill + dual-write trigger).
  // Falls back to variant.id if missing (defensive).
  const originalAlertId = typeof topicMeta.original_alert_id === 'string'
    ? topicMeta.original_alert_id
    : row.id

  // Prefer the preserved original alert.type when present (covers values like
  // 'point_purchase' that fall outside the smaller topic_type enum and would
  // otherwise be lost as 'other').
  const resolvedType = (pickString(variantMeta, 'original_alert_type') ?? t?.topic_type ?? 'industry_news') as AlertView['type']

  return {
    id: originalAlertId,
    slug: t?.slug ?? '',
    short_slug: pickString(variantMeta, 'short_slug'),
    title: row.title ?? '',
    summary: t?.summary ?? '',
    description: row.body,
    type: resolvedType,
    status: alertStatus as AlertView['status'],
    primary_program_id: null,  // junction-derived; Wave 2 consumers don't read this directly
    action_type: (pickString(variantMeta, 'action_type') ?? 'monitor') as AlertView['action_type'],
    suppress_home_banner: pickBoolean(variantMeta, 'suppress_home_banner') ?? false,
    start_date: pickString(variantMeta, 'start_date'),
    end_date: t?.end_date ?? null,
    published_at: row.published_at,
    source: pickString(variantMeta, 'alerts_source'),
    source_url: Array.isArray(t?.source_urls) && t.source_urls.length > 0 ? t.source_urls[0] : null,
    confidence_level: (pickString(variantMeta, 'confidence_level') ?? 'medium') as AlertView['confidence_level'],
    impact_score: pickNumber(editorialScores, 'impact_score') ?? 0,
    impact_justification: pickString(editorialScores, 'impact_justification') ?? '',
    value_score: pickNumber(editorialScores, 'value_score') ?? 0,
    rarity_score: pickNumber(editorialScores, 'rarity_score') ?? 0,
    computed_score: pickNumber(editorialScores, 'computed_score'),
    score_last_computed_at: null,
    history_note: pickString(variantMeta, 'history_note'),
    gaps: null,
    verified_terms: null,
    registration_required: pickBoolean(variantMeta, 'registration_required') ?? false,
    created_by: t?.created_by ?? null,
    approved_by: null,
    approved_at: null,
    source_intel_id: null,
    last_verified: pickString(variantMeta, 'last_verified'),
    fact_check_claims: Array.isArray(t?.fact_ledger) ? t.fact_ledger : [],
    fact_check_at: t?.verified_at ?? null,
    revision_log: null,
    editorial_value_add: (variantMeta as { editorial_value_add?: unknown } | null)?.editorial_value_add ?? null,
    is_hot: pickBoolean(editorialScores, 'is_hot') ?? false,
    decided_at: null,
    revisit_after: null,
    rejected_reason: null,
    why_this_matters: pickString(editorialScores, 'why_this_matters'),
    override_reason: pickString(variantMeta, 'override_reason'),
    voice_checked_at: pickString(variantMeta, 'voice_checked_at'),
    voice_pass: pickBoolean(variantMeta, 'voice_pass'),
    voice_notes: pickString(variantMeta, 'voice_notes'),
    voice_score: pickNumber(variantMeta, 'voice_score'),
    voice_lead_mode: (pickString(variantMeta, 'voice_lead_mode') ?? null) as AlertView['voice_lead_mode'],
    terms_waived_reason: pickString(variantMeta, 'terms_waived_reason'),
    context_loaded_at: null,
    originality_checked_at: null,
    originality_pass: null,
    originality_notes: null,
    created_at: pickString(topicMeta, 'original_alert_created_at') ?? row.created_at,
    updated_at: pickString(topicMeta, 'original_alert_updated_at') ?? row.updated_at,
    _view_source: 'variants',
  }
}

type SelectFilters = {
  /** Filter by variant.status (mapped from alert.status). Use 'published' for public reads. */
  status?: 'draft' | 'needs_review' | 'published' | 'archived'
  /** Filter by topics.slug (single row lookup). */
  slug?: string
  /** Limit results. */
  limit?: number
  /** Order by variant.published_at descending (most-recent first). Default true. */
  orderByPublishedDesc?: boolean
  /** Restrict to topics tagged with this program slug. */
  programSlug?: string
  /**
   * Exclude variants whose topic.end_date is in the past. The legacy `alerts`
   * read paths used `status='published'` which excluded `status='expired'`
   * rows; in the variants world both map to `status='published'` so we use
   * end_date for the same effect. Set true to preserve legacy semantics
   * (currently-live alerts only).
   */
  activeOnly?: boolean
  /**
   * When true, also fetch the `programs` table rows for every topic.programs
   * slug and attach them as `alert_programs` + `programs` on the result so
   * callers like AlertCard / AlertCardSB get the same shape they got from
   * the legacy alerts join. Adds one extra query (batched across all rows).
   */
  withPrograms?: boolean
}

/**
 * Read AlertView[] from content_variants + topics. Use for any public read
 * path that today queries `alerts` directly. Defaults match the "active
 * published" filter shape consumers expect.
 */
export async function selectAlertViewFromVariants(
  supabase: SupabaseClient,
  filters: SelectFilters = {},
): Promise<AlertView[]> {
  let q = supabase
    .from('content_variants')
    .select(SELECT_COLS)
    .eq('format', 'alert')

  if (filters.status) q = q.eq('status', filters.status)
  if (filters.slug) q = q.eq('topics.slug', filters.slug)
  if (filters.programSlug) q = q.contains('topics.programs', [filters.programSlug])
  if (filters.activeOnly) {
    q = q.or('end_date.is.null,end_date.gt.' + new Date().toISOString(), { foreignTable: 'topics' })
  }
  if (filters.orderByPublishedDesc !== false) q = q.order('published_at', { ascending: false, nullsFirst: false })
  if (typeof filters.limit === 'number') q = q.limit(filters.limit)

  const { data, error } = await q
  if (error) {
    console.error('[alertView] select failed:', error.message)
    return []
  }
  const variantRows = data as unknown as VariantRow[]
  const rows = variantRows.map(mapVariantRowToAlertView)
  if (!filters.withPrograms) return rows

  // Batch-lookup the programs table for every slug in any topic.programs[]
  // appearing in this result set. One query, then merge per-row.
  const flatSlugs = Array.from(new Set(variantRows.flatMap((vr) => vr.topics?.programs ?? [])))
  if (flatSlugs.length === 0) {
    return rows.map((r) => ({ ...r, alert_programs: [], programs: [] } as AlertViewWithPrograms))
  }

  const { data: programRows } = await supabase
    .from('programs')
    .select('*')
    .in('slug', flatSlugs)
  const programBySlug = new Map<string, Program>()
  for (const p of (programRows as Program[] | null) ?? []) programBySlug.set(p.slug, p)

  return rows.map((alert, i) => {
    const vr = variantRows[i]
    const slugs = vr.topics?.programs ?? []
    const primaryId = (vr.topics?.metadata as { primary_program_id?: string } | null)?.primary_program_id ?? null
    const matchedPrograms = slugs.map((s) => programBySlug.get(s)).filter((p): p is Program => !!p)
    const alert_programs: (AlertProgram & { programs: Program })[] = matchedPrograms.map((p) => ({
      id: `${vr.topic_id}-${p.id}`,
      alert_id: alert.id,
      program_id: p.id,
      role: primaryId && p.id === primaryId ? 'primary' : 'secondary',
      created_at: alert.created_at,
      programs: p,
    }))
    return { ...alert, alert_programs, programs: matchedPrograms } as AlertViewWithPrograms
  })
}

/** Single-row lookup by slug (the variant must be format='alert'). */
export async function getAlertViewBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<AlertView | null> {
  const rows = await selectAlertViewFromVariants(supabase, { slug, limit: 1 })
  return rows[0] ?? null
}
