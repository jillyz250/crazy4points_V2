/**
 * Phase 3 Wave 3a — single helper that replaces every direct INSERT/UPDATE
 * to the `alerts` table. Writes to `content_variants + topics + alert_programs`;
 * the variants_sync_to_alerts trigger mirrors back to alerts.
 *
 * See plans/phase3-domain-model.md for the invariants this helper enforces.
 *
 * Caller surface preserved: takes the same fields the legacy alerts INSERT
 * accepted. Returns the original alert id (preserved via
 * topic.metadata.original_alert_id) for downstream consumers.
 *
 * Responsibilities (per Copilot review hardening):
 *   1. Normalize editorial metadata — arrays default to [], booleans canonical,
 *      stable ordering, canonical default shapes.
 *   2. Short_slug stability — preserved on the variant; never regenerated
 *      unless explicitly requested.
 *   3. Program role enforcement — primary_program_id on topic.metadata is
 *      the authority during Wave 3a; the trigger reconciles alert_programs.
 *   4. Junction reconciliation — topic.programs[] always equals the slug
 *      set of (primary + secondary) program tags.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Alert, AlertStatus, AlertType } from '@/utils/supabase/queries'

export interface WriteAlertVariantInput {
  /**
   * Existing alert id when updating. Omit for a brand-new alert (will be
   * generated and persisted to topic.metadata.original_alert_id).
   */
  id?: string

  /** Canonical URL slug. Must be unique across topics. */
  slug: string

  // Core editorial fields
  title: string
  summary: string
  description?: string | null
  type: AlertType
  status: AlertStatus
  action_type?: string | null

  // Dates
  start_date?: string | null
  end_date?: string | null
  published_at?: string | null

  // Programs (tagging)
  primary_program_id?: string | null
  /**
   * Program slugs (NOT program ids) tagged on this story.
   * Includes the primary program's slug. Order is not preserved (junction
   * normalizes by slug name).
   */
  program_slugs?: string[]

  // Provenance + scoring
  source?: string | null
  source_url?: string | null
  source_intel_id?: string | null
  confidence_level?: string | null
  impact_score?: number | null
  value_score?: number | null
  rarity_score?: number | null
  impact_justification?: string | null
  why_this_matters?: string | null
  is_hot?: boolean | null
  history_note?: string | null
  override_reason?: string | null
  registration_required?: boolean | null
  short_slug?: string | null

  // Editorial check stamps (write through as variant metadata)
  voice_pass?: boolean | null
  voice_score?: number | null
  voice_notes?: string | null
  voice_checked_at?: string | null
  voice_lead_mode?: string | null
  originality_pass?: boolean | null
  originality_notes?: string | null
  originality_checked_at?: string | null
  fact_check_claims?: unknown[] | null
  fact_check_at?: string | null
  revision_log?: unknown[] | null
  gaps?: unknown | null
  verified_terms?: string | null
  terms_waived_reason?: string | null
  last_verified?: string | null

  created_by?: string | null
}

export interface WriteAlertVariantResult {
  /** The original alert id (preserved for compatibility with admin URLs). */
  alert_id: string
  /** The topic id. */
  topic_id: string
  /** The variant id. */
  variant_id: string
}

// --------------------------------------------------------------------------
// Normalization helpers — canonical shapes so the parity harness doesn't
// catch trivial whitespace/null differences as drift.
// --------------------------------------------------------------------------

function normString(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null
  const trimmed = String(v).trim()
  return trimmed.length === 0 ? null : trimmed
}

function normBool(v: boolean | null | undefined): boolean | null {
  if (v === null || v === undefined) return null
  return v === true
}

function normInt(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  return Math.round(Number(v))
}

function normArray<T>(v: T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : []
}

function normSlug(v: string): string {
  return String(v).trim().toLowerCase()
}

// Status mapping: alerts.status → content_variants.status
function variantStatusFromAlert(s: AlertStatus): 'draft' | 'needs_review' | 'approved' | 'published' | 'archived' {
  switch (s) {
    case 'draft': return 'draft'
    case 'pending_review': return 'needs_review'
    case 'published': return 'published'
    case 'expired': return 'published'  // URL stays live; topic.end_date indicates expiry
    case 'rejected':
    case 'soft_rejected':
      return 'archived'
    default:
      return 'draft'
  }
}

// Topic status mapping: alerts.status → topics.status
function topicStatusFromAlert(s: AlertStatus): 'draft' | 'active' | 'archived' {
  switch (s) {
    case 'draft':           return 'draft'
    case 'pending_review':  return 'active'
    case 'published':       return 'active'
    case 'expired':         return 'active'
    case 'rejected':
    case 'soft_rejected':
      return 'archived'
    default:
      return 'draft'
  }
}

// AlertType (28 values) → TopicType (22 values + 'other')
const TOPIC_TYPE_BY_ALERT_TYPE: Record<string, string> = {
  transfer_bonus: 'transfer_bonus',
  signup_bonus: 'signup_bonus',
  referral_bonus: 'referral_bonus',
  retention_offer: 'retention_offer',
  limited_time_offer: 'limited_time_offer',
  status_promo: 'status_promo',
  award_availability: 'award_availability',
  sweet_spot: 'sweet_spot',
  glitch: 'glitch',
  devaluation: 'devaluation',
  earn_rate_change: 'earn_rate_change',
  category_change: 'category_change',
  partner_change: 'partner_change',
  program_change: 'program_change',
  status_change: 'status_change',
  policy_change: 'policy_change',
  industry_news: 'industry_news',
  shopping_portal_bonus: 'shopping_portal_bonus',
  award_sale: 'award_sale',
  companion_pass: 'companion_pass',
  dining_bonus: 'dining_bonus',
  fee_change: 'fee_change',
  card_refresh: 'card_refresh',
  milestone_bonus: 'milestone_bonus',
  card_credit: 'card_credit',
}

function mapTopicType(alertType: string | null | undefined): string {
  if (!alertType) return 'other'
  return TOPIC_TYPE_BY_ALERT_TYPE[alertType] ?? 'other'
}

// --------------------------------------------------------------------------
// Main helper
// --------------------------------------------------------------------------

export async function writeAlertVariant(
  supabase: SupabaseClient,
  input: WriteAlertVariantInput,
): Promise<WriteAlertVariantResult> {
  const slug = normSlug(input.slug)
  const programSlugs = normArray(input.program_slugs).map((s) => normSlug(s))

  // Build editorial_scores (canonical shape on topic.metadata)
  const editorialScores = {
    impact_score: normInt(input.impact_score) ?? 5,
    value_score: normInt(input.value_score) ?? 5,
    rarity_score: normInt(input.rarity_score) ?? 5,
    computed_score: null as number | null,
    impact_justification: normString(input.impact_justification) ?? '',
    is_hot: normBool(input.is_hot) ?? false,
    why_this_matters: normString(input.why_this_matters),
  }

  // Topic metadata — facts about the story, authority for editorial scoring
  // and primary program during Wave 3a. The trigger reads from here to write
  // the alerts mirror; the parity harness diffs against this.
  const topicMetadata: Record<string, unknown> = {
    source: 'wave3_helper',
    editorial_scores: editorialScores,
    original_alert_id: input.id ?? null,
    source_intel_id: normString(input.source_intel_id),
    primary_program_id: normString(input.primary_program_id),
  }

  // Variant metadata — per-format fields the trigger uses to reconstruct
  // the alerts row. Canonical shape; defaults explicit.
  const variantMetadata: Record<string, unknown> = {
    source: 'wave3_helper',
    short_slug: normString(input.short_slug),
    action_type: normString(input.action_type) ?? 'monitor',
    start_date: normString(input.start_date),
    registration_required: normBool(input.registration_required) ?? false,
    override_reason: normString(input.override_reason),
    terms_waived_reason: normString(input.terms_waived_reason),
    voice_pass: normBool(input.voice_pass),
    voice_score: normInt(input.voice_score),
    voice_notes: normString(input.voice_notes),
    voice_checked_at: normString(input.voice_checked_at),
    voice_lead_mode: normString(input.voice_lead_mode),
    originality_pass: normBool(input.originality_pass),
    originality_notes: normString(input.originality_notes),
    originality_checked_at: normString(input.originality_checked_at),
    history_note: normString(input.history_note),
    confidence_level: normString(input.confidence_level) ?? 'medium',
    alerts_source: normString(input.source),
    original_alert_type: input.type,
    last_verified: normString(input.last_verified),
    verified_terms: normString(input.verified_terms),
    gaps: input.gaps ?? null,
    revision_log: normArray(input.revision_log),
  }

  // Upsert topic
  const topicRow = {
    slug,
    title: input.title,
    summary: input.summary,
    topic_type: mapTopicType(input.type),
    source_urls: normString(input.source_url) ? [normString(input.source_url) as string] : [],
    fact_ledger: normArray(input.fact_check_claims),
    fact_check_status: input.fact_check_at ? 'verified' : 'pending',
    verified_at: normString(input.fact_check_at),
    programs: programSlugs,
    cards: [],
    end_date: normString(input.end_date),
    status: topicStatusFromAlert(input.status),
    created_by: normString(input.created_by) ?? 'wave3_helper',
    metadata: topicMetadata,
  }

  // First check if topic exists
  const { data: existingTopic } = await supabase
    .from('topics')
    .select('id, metadata')
    .eq('slug', slug)
    .maybeSingle()

  let topicId: string
  if (existingTopic) {
    topicId = existingTopic.id as string
    // Merge metadata — preserve fields not in our payload (compatibility shim)
    const mergedMeta = { ...(existingTopic.metadata as object), ...topicMetadata }
    // If we're updating without an explicit id, preserve original_alert_id
    if (!input.id) {
      const existingAlertId = (existingTopic.metadata as { original_alert_id?: string } | null)?.original_alert_id
      if (existingAlertId) mergedMeta['original_alert_id'] = existingAlertId
    }
    const { error: tuErr } = await supabase
      .from('topics')
      .update({ ...topicRow, metadata: mergedMeta })
      .eq('id', topicId)
    if (tuErr) throw new Error(`writeAlertVariant: topic update failed: ${tuErr.message}`)
  } else {
    const { data: inserted, error: tiErr } = await supabase
      .from('topics')
      .insert(topicRow)
      .select('id')
      .single()
    if (tiErr || !inserted) throw new Error(`writeAlertVariant: topic insert failed: ${tiErr?.message ?? 'unknown'}`)
    topicId = inserted.id as string
  }

  // Upsert variant — (topic_id, format='alert') is unique by constraint
  const variantRow = {
    topic_id: topicId,
    format: 'alert' as const,
    title: input.title,
    body: normString(input.description),
    metadata: variantMetadata,
    brand_voice_run: input.voice_checked_at !== null && input.voice_checked_at !== undefined,
    fact_check_run: input.fact_check_at !== null && input.fact_check_at !== undefined,
    fact_check_results: null,
    status: variantStatusFromAlert(input.status),
    published_at: normString(input.published_at),
    publish_target_url: `/alerts/${slug}`,
    generated_by: 'editor' as const,
  }

  const { data: variantRes, error: vErr } = await supabase
    .from('content_variants')
    .upsert(variantRow, { onConflict: 'topic_id,format' })
    .select('id')
    .single()
  if (vErr || !variantRes) throw new Error(`writeAlertVariant: variant upsert failed: ${vErr?.message ?? 'unknown'}`)
  const variantId = variantRes.id as string

  // Read back the alert id (trigger may have generated one if none was passed)
  const { data: topicAfter } = await supabase
    .from('topics')
    .select('metadata')
    .eq('id', topicId)
    .single()
  const alertId = (topicAfter?.metadata as { original_alert_id?: string } | null)?.original_alert_id ?? input.id
  if (!alertId) {
    throw new Error('writeAlertVariant: no alert id resolved after upsert; trigger should have generated one')
  }

  return { alert_id: alertId, topic_id: topicId, variant_id: variantId }
}

/**
 * Update an existing variant's status without rewriting other fields.
 * Used by reject/approve/publish actions that only change status.
 */
export async function updateAlertVariantStatus(
  supabase: SupabaseClient,
  alertId: string,
  newStatus: AlertStatus,
  extra?: { decided_at?: string; published_at?: string; rejected_reason?: string },
): Promise<void> {
  // Find topic via metadata.original_alert_id
  const { data: topic } = await supabase
    .from('topics')
    .select('id')
    .eq('metadata->>original_alert_id', alertId)
    .maybeSingle()
  if (!topic) throw new Error(`updateAlertVariantStatus: no topic found for alert ${alertId}`)

  const variantStatus = variantStatusFromAlert(newStatus)
  const topicStatus = topicStatusFromAlert(newStatus)

  // Update topic status + (optionally) metadata
  await supabase
    .from('topics')
    .update({ status: topicStatus })
    .eq('id', topic.id)

  // Update variant status + published_at
  const variantUpdate: Record<string, unknown> = { status: variantStatus }
  if (extra?.published_at) variantUpdate.published_at = extra.published_at
  await supabase
    .from('content_variants')
    .update(variantUpdate)
    .eq('topic_id', topic.id)
    .eq('format', 'alert')
}

/**
 * Reject (hard or soft) an existing alert. Sets variant.status='archived',
 * topic.status='archived', and stamps the archive metadata that the
 * variants→alerts trigger uses to project the correct alerts.status
 * ('rejected' vs 'soft_rejected').
 *
 * Hard reject: kind='rejected'. Scout's dedup blocks resurfacing via
 * decided_at + N-day window.
 *
 * Soft reject: kind='soft_rejected', provide revisitAfter ISO string.
 * Scout's dedup blocks until revisit_after passes.
 */
export async function rejectAlertVariant(
  supabase: SupabaseClient,
  alertId: string,
  opts: {
    kind: 'rejected' | 'soft_rejected'
    revisitAfter?: string  // ISO; required for soft_rejected
    rejectedReason?: string | null
  },
): Promise<void> {
  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) throw new Error(`rejectAlertVariant: no topic/variant for alert ${alertId}`)

  const decidedAt = new Date().toISOString()

  // Read current variant metadata so we don't clobber other fields
  const { data: variant } = await supabase
    .from('content_variants')
    .select('metadata')
    .eq('id', refs.variant_id)
    .single()

  const newMeta = {
    ...((variant?.metadata as object) ?? {}),
    archive_reason: opts.kind,
    decided_at: decidedAt,
    revisit_after: opts.kind === 'soft_rejected' ? (opts.revisitAfter ?? null) : null,
    rejected_reason: opts.kind === 'rejected' ? (opts.rejectedReason ?? null) : null,
  }

  // Topic to archived
  await supabase
    .from('topics')
    .update({ status: 'archived' })
    .eq('id', refs.topic_id)

  // Variant to archived with reason metadata
  const { error: vErr } = await supabase
    .from('content_variants')
    .update({
      status: 'archived',
      archived_at: decidedAt,
      metadata: newMeta,
    })
    .eq('id', refs.variant_id)
  if (vErr) throw new Error(`rejectAlertVariant: variant update failed: ${vErr.message}`)
}

/**
 * Lookup helper: find the topic+variant ids for a legacy alert id.
 * Returns null if no matching topic exists (e.g. for rejected alerts that
 * were never backfilled).
 */
export async function findVariantByAlertId(
  supabase: SupabaseClient,
  alertId: string,
): Promise<{ topic_id: string; variant_id: string } | null> {
  const { data: topic } = await supabase
    .from('topics')
    .select('id')
    .eq('metadata->>original_alert_id', alertId)
    .maybeSingle()
  if (!topic) return null

  const { data: variant } = await supabase
    .from('content_variants')
    .select('id')
    .eq('topic_id', topic.id)
    .eq('format', 'alert')
    .maybeSingle()
  if (!variant) return null

  return { topic_id: topic.id as string, variant_id: variant.id as string }
}
