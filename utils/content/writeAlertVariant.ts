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
  /**
   * Writer-emitted admin-only QC log — array of { label, evidence } items
   * describing the editorial value-add beyond raw_text. Stored in
   * variant metadata; trigger mirrors into alerts.editorial_value_add.
   * Never shown to readers.
   */
  editorial_value_add?: unknown[] | null
  verified_terms?: string | null
  apply_card_slug?: string | null
  /** Outbound URL to the official offer/action page (neutral "Go to the official offer" button). */
  offer_url?: string | null
  /** Legal/compliance disclosure text (financial-product / offer alerts). */
  legal_disclosure?: string | null
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
  experience: 'experience',
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
    apply_card_slug: normString(input.apply_card_slug),
    offer_url: normString(input.offer_url),
    legal_disclosure: normString(input.legal_disclosure),
    gaps: input.gaps ?? null,
    editorial_value_add: normArray(input.editorial_value_add),
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

  // Phase 4: promoted columns. Helper writes both column AND metadata in a
  // single object literal — no conditional branches (Invariant V1: symmetric
  // dual-write). Trigger reads column first via COALESCE.
  //
  // VSV1 — variant_schema_version is always set explicitly (no silent drift).
  // A3 — metadata dual-write happens only at schema_version=1; future formats
  //      (schema_version ≥ 2) write columns only.
  const SCHEMA_VERSION = 1
  const promotedColumns = {
    voice_pass: normBool(input.voice_pass),
    voice_score: normInt(input.voice_score),
    confidence_level: normString(input.confidence_level) ?? 'medium',
    action_type: normString(input.action_type) ?? 'monitor',
    original_alert_type: input.type,
    start_date: normString(input.start_date),
    short_slug: normString(input.short_slug),
    verified_terms: normString(input.verified_terms),
    terms_waived_reason: normString(input.terms_waived_reason),
    variant_schema_version: SCHEMA_VERSION,
  }

  // Upsert variant — (topic_id, format='alert') is unique by constraint
  const variantRow = {
    topic_id: topicId,
    format: 'alert' as const,
    title: input.title,
    body: normString(input.description),
    metadata: variantMetadata,
    ...promotedColumns,
    brand_voice_run: input.voice_checked_at !== null && input.voice_checked_at !== undefined,
    fact_check_run: input.fact_check_at !== null && input.fact_check_at !== undefined,
    fact_check_results: null,
    status: variantStatusFromAlert(input.status),
    // Stamp published_at on first publish even when the caller didn't pass one,
    // so a published alert always carries a real date (feed + newsletter sort by it).
    published_at: normString(input.published_at)
      ?? (variantStatusFromAlert(input.status) === 'published' ? new Date().toISOString() : null),
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

  // On publish, stamp published_at if it's still missing (no explicit date passed and
  // the row was never dated). The .is(null) guard preserves the ORIGINAL publish date
  // on a re-publish after edits, so the feed + newsletter always have a real timestamp.
  if (variantStatus === 'published' && !extra?.published_at) {
    await supabase
      .from('content_variants')
      .update({ published_at: new Date().toISOString() })
      .eq('topic_id', topic.id)
      .eq('format', 'alert')
      .is('published_at', null)
  }
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
 * Reconcile the program tagging for an existing alert. Updates
 * topic.programs[] (slug projection of the junction) +
 * topic.metadata.primary_program_id (authority during Wave 3a) and touches
 * the variant so the trigger rebuilds alert_programs from the new state.
 *
 * Takes program IDs (matching the legacy setAlertPrograms surface) and
 * resolves them to slugs for the topic.programs[] array.
 */
export async function setAlertVariantPrograms(
  supabase: SupabaseClient,
  alertId: string,
  opts: {
    primaryProgramId: string | null
    /** Secondary program IDs only. Primary is handled separately. */
    secondaryProgramIds: string[]
  },
): Promise<void> {
  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) throw new Error(`setAlertVariantPrograms: no topic/variant for alert ${alertId}`)

  // Build the full slug set (primary + secondaries) by looking up programs.
  const allIds = [
    ...(opts.primaryProgramId ? [opts.primaryProgramId] : []),
    ...opts.secondaryProgramIds,
  ]
  let allSlugs: string[] = []
  if (allIds.length > 0) {
    const { data: programs } = await supabase
      .from('programs')
      .select('slug')
      .in('id', allIds)
    allSlugs = (programs ?? []).map((p) => p.slug as string).sort()
  }

  // Merge primary_program_id into topic.metadata (preserve other keys)
  const { data: topic } = await supabase
    .from('topics')
    .select('metadata')
    .eq('id', refs.topic_id)
    .single()
  const mergedTopicMeta = {
    ...((topic?.metadata as object) ?? {}),
    primary_program_id: opts.primaryProgramId ?? null,
  }

  await supabase
    .from('topics')
    .update({ programs: allSlugs, metadata: mergedTopicMeta })
    .eq('id', refs.topic_id)

  // Touch variant so trigger rebuilds alert_programs from the new topic state
  await supabase
    .from('content_variants')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', refs.variant_id)
}

/**
 * Publish an existing alert. Sets variant.status='published',
 * published_at=now, stamps approved_at + decided_at + short_slug on
 * variant.metadata. Topic flips to 'active' (no-op if already there).
 *
 * The variants → alerts trigger projects all of this to the alerts
 * mirror row.
 */
export async function publishAlertVariant(
  supabase: SupabaseClient,
  alertId: string,
  opts?: { approved_at?: string; shortSlugGenerator?: (title: string) => Promise<string | null> },
): Promise<void> {
  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) throw new Error(`publishAlertVariant: no topic/variant for alert ${alertId}`)

  const now = new Date().toISOString()

  const { data: v } = await supabase
    .from('content_variants')
    .select('title, metadata')
    .eq('id', refs.variant_id)
    .single()

  // Generate a short_slug if one isn't already set and the caller provided
  // a generator function. Keep this idempotent: existing short_slugs are
  // never overwritten (I4 — URLs are forever).
  const currentMeta = (v?.metadata as Record<string, unknown>) ?? {}
  let shortSlug: string | null = (currentMeta.short_slug as string | null) ?? null
  if (!shortSlug && opts?.shortSlugGenerator) {
    try {
      shortSlug = await opts.shortSlugGenerator((v?.title as string) ?? '')
    } catch {
      shortSlug = null
    }
  }
  // Fallback: generate a slug even when the caller passed no generator.
  // Automated publish paths (Scout auto-publish, bulk) used to omit it, which
  // left the alert slug-less — breaking its public URL AND silently skipping
  // the social reminder below (the `if (link)` guard). Never depend on the
  // caller for this. Idempotent: an existing slug is never overwritten.
  if (!shortSlug && (v?.title as string)?.trim()) {
    try {
      const { generateUniqueShortSlug } = await import('@/utils/alerts/generateShortSlug')
      shortSlug = await generateUniqueShortSlug(supabase, v!.title as string)
    } catch (err) {
      console.error('[publishAlertVariant] fallback short_slug generation failed (non-fatal):', err)
    }
  }

  const newMeta: Record<string, unknown> = { ...currentMeta, decided_at: now }
  if (shortSlug) newMeta.short_slug = shortSlug
  if (opts?.approved_at) newMeta.approved_at = opts.approved_at

  // ── CLOSED-LOOP GUARD (Jill, 2026-09-04) ──────────────────────────────────
  // Every published alert must either EXPIRE (topic.end_date) or be on a
  // RECHECK clock (last_verified → refresh queue) — never neither, or it can
  // advertise dead/drifted info forever (the "12 orphan alerts" gap). If this
  // alert has no end_date, stamp last_verified=now so it enters the recheck
  // cadence from day one. Mirrors to alerts.last_verified via the variants
  // trigger; never overwrites an existing stamp. See CLAUDE.md "Closed-loop
  // principle".
  const { data: topicEnd } = await supabase
    .from('topics')
    .select('end_date')
    .eq('id', refs.topic_id)
    .single()
  if (!topicEnd?.end_date && !currentMeta.last_verified) {
    newMeta.last_verified = now
  }

  // Topic to active (if archived from a prior rejection)
  await supabase
    .from('topics')
    .update({ status: 'active' })
    .eq('id', refs.topic_id)

  // Variant published
  const { error } = await supabase
    .from('content_variants')
    .update({
      status: 'published',
      published_at: now,
      metadata: newMeta,
      archived_at: null,
    })
    .eq('id', refs.variant_id)
  if (error) throw new Error(`publishAlertVariant: variant update failed: ${error.message}`)

  // Auto-create a "post this to social" reminder so no publish slips by without
  // a nudge. Every published alert gets one; the editor dismisses the ones not
  // worth posting. Idempotent (one per alert URL) and non-fatal — a reminder
  // failure must never break a publish.
  try {
    const { data: topic } = await supabase
      .from('topics')
      .select('slug, end_date')
      .eq('id', refs.topic_id)
      .single()
    const alertSlug = shortSlug ?? (topic?.slug as string | undefined)
    const link = alertSlug ? `/alerts/${alertSlug}` : null
    if (link) {
      const { data: existing } = await supabase
        .from('reminders')
        .select('id')
        .eq('link', link)
        .limit(1)
      if (!existing?.length) {
        const title = (v?.title as string) ?? 'this alert'
        // Last-chance nudge 2 days before a real deadline; otherwise prompt soon.
        const end = topic?.end_date ? new Date(topic.end_date as string) : null
        const twoDaysBefore = end ? new Date(end.getTime() - 2 * 86_400_000) : null
        const useDeadline = !!twoDaysBefore && twoDaysBefore.getTime() > Date.now()
        const dueObj = useDeadline ? twoDaysBefore! : new Date(Date.now() + 86_400_000)
        await supabase.from('reminders').insert({
          title: (useDeadline ? `Social post before it ends: ${title}` : `Social post: ${title}`).slice(0, 200),
          notes: 'Auto-added on publish. Post to Facebook/Instagram (facebook-post / instagram-post skill), or dismiss if not worth posting.',
          due_date: dueObj.toISOString().slice(0, 10),
          status: 'open',
          link,
        })
      }
    }
  } catch (err) {
    console.error('[publishAlertVariant] social reminder auto-create failed (non-fatal):', err)
  }

  // Activity chain + TWO-EYES record: post the finished alert onto the teammates'
  // pages (Jill's "what I shipped" feed). Two independent functions touch every
  // published fact — John (Content) MAKES it, Vera (Fact-Check, under Priya) is the
  // independent CHECKER — so both get a linked entry and the two-eyes is auditable.
  // Best-effort — never blocks a publish. See plans/two-eyes-policy.md.
  try {
    const { data: t2 } = await supabase.from('topics').select('slug').eq('id', refs.topic_id).single()
    const aslug = shortSlug ?? (t2?.slug as string | undefined)
    const alink = aslug ? `/alerts/${aslug}` : null
    const atitle = (v?.title as string) ?? 'an alert'
    const { logEmployeeActivities } = await import('@/utils/org/logEmployeeActivity')
    await logEmployeeActivities(supabase, [
      { employee_slug: 'vera-factcheck', action: 'verified', summary: atitle, ref_type: 'alert', ref_id: alertId, link: alink },
      { employee_slug: 'john-content', action: 'published', summary: atitle, ref_type: 'alert', ref_id: alertId, link: alink },
    ])
  } catch (err) {
    console.error('[publishAlertVariant] activity log failed (non-fatal):', err)
  }
}

/**
 * Expire an alert. Topic.end_date set to now; the variants→alerts trigger
 * detects topic.end_date < now and projects status='expired' on alerts.
 * Variant stays status='published' so public URLs keep working — only the
 * derived alerts.status flips.
 */
export async function expireAlertVariant(
  supabase: SupabaseClient,
  alertId: string,
): Promise<void> {
  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) throw new Error(`expireAlertVariant: no topic/variant for alert ${alertId}`)

  const now = new Date().toISOString()

  await supabase
    .from('topics')
    .update({ end_date: now })
    .eq('id', refs.topic_id)

  // Touch variant so trigger fires
  await supabase
    .from('content_variants')
    .update({ updated_at: now })
    .eq('id', refs.variant_id)
}

/**
 * Merge a partial metadata payload into the variant's metadata. Touches
 * the variant so the trigger re-mirrors to alerts. Used by voice/originality
 * check actions that only update a handful of metadata keys.
 */
export async function updateAlertVariantMetadata(
  supabase: SupabaseClient,
  alertId: string,
  partial: Record<string, unknown>,
  opts?: { brand_voice_run?: boolean; fact_check_run?: boolean },
): Promise<void> {
  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) throw new Error(`updateAlertVariantMetadata: no topic/variant for alert ${alertId}`)

  const { data: v } = await supabase
    .from('content_variants')
    .select('metadata')
    .eq('id', refs.variant_id)
    .single()

  const merged = { ...((v?.metadata as object) ?? {}), ...partial }
  const update: Record<string, unknown> = { metadata: merged, updated_at: new Date().toISOString() }
  if (opts?.brand_voice_run !== undefined) update.brand_voice_run = opts.brand_voice_run
  if (opts?.fact_check_run !== undefined) update.fact_check_run = opts.fact_check_run

  const { error } = await supabase
    .from('content_variants')
    .update(update)
    .eq('id', refs.variant_id)
  if (error) throw new Error(`updateAlertVariantMetadata: variant update failed: ${error.message}`)
}

/**
 * Write fact-check claims to topic.fact_ledger and bump topic.verified_at.
 * Touches the variant so the trigger re-mirrors. The source of truth for
 * claims is the topic, not the variant.
 */
export async function updateTopicFactLedger(
  supabase: SupabaseClient,
  alertId: string,
  claims: unknown[],
  opts?: { verified_at?: string },
): Promise<void> {
  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) throw new Error(`updateTopicFactLedger: no topic/variant for alert ${alertId}`)

  const verifiedAt = opts?.verified_at ?? new Date().toISOString()
  await supabase
    .from('topics')
    .update({ fact_ledger: claims, verified_at: verifiedAt, fact_check_status: 'verified' })
    .eq('id', refs.topic_id)

  await supabase
    .from('content_variants')
    .update({ fact_check_run: true, updated_at: new Date().toISOString() })
    .eq('id', refs.variant_id)
}

/**
 * Update the variant's body (description) directly. Used by quick-fix flows
 * that just need to change the rendered copy. Trigger mirrors variant.body
 * to alerts.description.
 */
export async function updateAlertVariantBody(
  supabase: SupabaseClient,
  alertId: string,
  body: string,
): Promise<void> {
  const refs = await findVariantByAlertId(supabase, alertId)
  if (!refs) throw new Error(`updateAlertVariantBody: no topic/variant for alert ${alertId}`)

  const { error } = await supabase
    .from('content_variants')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', refs.variant_id)
  if (error) throw new Error(`updateAlertVariantBody: variant update failed: ${error.message}`)
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
