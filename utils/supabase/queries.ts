import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Types ───────────────────────────────────────────────────────────────────
export type AlertType =
  | 'transfer_bonus'
  | 'limited_time_offer'
  | 'award_availability'
  | 'status_promo'
  | 'glitch'
  | 'devaluation'
  | 'program_change'
  | 'partner_change'
  | 'category_change'
  | 'earn_rate_change'
  | 'status_change'
  | 'policy_change'
  | 'sweet_spot'
  | 'industry_news'
  | 'signup_bonus'
  | 'referral_bonus'
  | 'retention_offer'
  | 'shopping_portal_bonus'
  | 'point_purchase'
  | 'award_sale'
  | 'companion_pass'
  | 'dining_bonus'
  | 'fee_change'
  | 'card_refresh'
  | 'milestone_bonus'
  | 'card_credit'

export type AlertStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'soft_rejected'
  | 'expired'

export type AlertActionType =
  | 'book'
  | 'transfer'
  | 'apply'
  | 'status_match'
  | 'buy_miles'
  | 'activate'
  | 'monitor'
  | 'learn'

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface AlertGap {
  field: string         // e.g. "booking_window", "travel_window", "exclusions"
  filled: string | null // null = writer flagged unknown, admin hasn't filled
}

export type ProgramType =
  | 'credit_card'
  | 'airline'
  | 'hotel'
  | 'loyalty_program'
  | 'alliance'
  | 'car_rental'
  | 'cruise'
  | 'shopping_portal'
  | 'travel_portal'
  | 'lounge_network'
  | 'ota'

export type MonitorTier = 'daily' | 'weekly' | 'monthly'

export type SourceType = 'official_partner' | 'blog' | 'community' | 'social' | 'email'

export interface Source {
  id: string
  name: string
  url: string
  type: SourceType
  tier: number
  is_active: boolean
  scrape_frequency: string
  notes: string | null
  last_scraped_at: string | null
  items_produced: number
  items_approved: number
  use_firecrawl: boolean
  created_at: string
  updated_at: string
}

export type SourceWithFeedCount = Source & { feed_count: number }

export interface Alert {
  id: string
  slug: string
  /**
   * Short, human-readable slug for /a/<short> shareable URLs.
   * Auto-generated from title at publish time. Migration 245.
   */
  short_slug: string | null
  title: string
  summary: string
  description: string | null
  type: AlertType
  status: AlertStatus
  primary_program_id: string | null
  action_type: AlertActionType
  start_date: string | null
  end_date: string | null
  published_at: string | null
  source: string | null
  source_url: string | null
  confidence_level: ConfidenceLevel
  impact_score: number
  impact_justification: string
  value_score: number
  rarity_score: number
  computed_score: number | null
  score_last_computed_at: string | null
  history_note: string | null
  /**
   * Gap fields flagged by the writer as unknown at draft time, plus any
   * admin-supplied fills. Shape: { field: string, filled: string | null }[].
   * Filled entries get fed back into the writer as verified context on
   * regenerate; unfilled entries stay out of the published description
   * ("only verified ships").
   */
  gaps: AlertGap[] | null
  /**
   * Admin-pasted authoritative source text (full T&Cs, press release,
   * official FAQ excerpt). Treated as ground truth on regenerate —
   * injected into the writer's extra_context as a VERIFIED OFFICIAL TERMS
   * block. Reader-invisible; lives only on the alert row.
   */
  verified_terms: string | null
  registration_required: boolean
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  source_intel_id: string | null
  last_verified: string | null
  fact_check_claims: unknown | null
  fact_check_at: string | null
  revision_log: unknown | null
  is_hot: boolean
  /** When the most recent reject / soft-reject / publish decision was made. */
  decided_at: string | null
  /** For soft-rejected alerts: when Scout's dedup should stop suppressing similar findings. */
  revisit_after: string | null
  rejected_reason: string | null
  /** One short editorial reason readers should care. Auto-filled by build-brief; editable. */
  why_this_matters: string | null
  /** Set to record an editorial override on a borderline call. */
  override_reason: string | null
  /** Phase 5b — brand voice check stamps. */
  voice_checked_at: string | null
  voice_pass: boolean | null
  voice_notes: string | null
  /** Writer redesign — voice gate detail (migration 266). */
  voice_score: number | null
  voice_lead_mode: 'A' | 'B' | 'C' | 'none' | null
  /** Writer redesign — T&C gate (migration 266). */
  terms_waived_reason: string | null
  /** Writer redesign — debug signal for buildExtraContext runs (migration 266). */
  context_loaded_at: string | null
  /** Phase 5b — originality check stamps. */
  originality_checked_at: string | null
  originality_pass: boolean | null
  originality_notes: string | null
  created_at: string
  updated_at: string
}

export type Alliance = 'skyteam' | 'star_alliance' | 'oneworld' | 'none' | 'other'

export const ALLIANCE_OPTIONS: Array<{ value: Alliance; label: string }> = [
  { value: 'skyteam',       label: 'SkyTeam' },
  { value: 'star_alliance', label: 'Star Alliance' },
  { value: 'oneworld',      label: 'oneworld' },
  { value: 'none',          label: 'None (independent)' },
  { value: 'other',         label: 'Other / partnership' },
]

export interface TransferPartnerTier {
  /** Tier identifier — currently 'premium' or 'standard'; reserved for future per-card tier names. */
  tier: string
  /** Base transfer ratio for this tier (e.g. "1:1", "1:0.7"). */
  ratio: string
  /** Promo-boosted ratio, if a temporary bonus is running. Renderer should show
   *  this with a strikethrough on `ratio` when present. */
  promo_ratio?: string | null
  /** Credit card slugs (matches `credit_cards.slug`) that qualify for this tier's ratio. */
  eligible_card_slugs: string[]
}

export interface TransferPartnerRow {
  from_slug: string
  /** Flat ratio — used by non-tiered programs (Amex/Chase/Bilt/Cap One/hotels).
   *  When `tiers` is populated, this is ignored at render-time. */
  ratio: string
  notes: string | null
  bonus_active: boolean
  /** Tier-aware ratios. Set for programs where the ratio depends on which
   *  card the holder has (Citi ThankYou is the canonical case). When present,
   *  the renderer picks the row matching the viewer's card slug; on the
   *  program page it shows all tiers side by side. */
  tiers?: TransferPartnerTier[] | null
}

export interface TierBenefitRow {
  name: string
  qualification: string
  benefits: string[]
}

export interface TierCrossoverRow {
  alliance_tier: 'Emerald' | 'Sapphire' | 'Ruby' | 'Elite Plus' | 'Elite' | 'Gold' | 'Silver' | string
  member_tier: string
}

export interface MemberProgramRow {
  program_slug: string
  carrier_slugs?: string[] | null
  joined?: string | null
  tier_crossover?: TierCrossoverRow[] | null
  notes?: string | null
}

export interface Program {
  id: string
  slug: string
  name: string
  type: ProgramType
  tier: string | null
  monitor_tier: MonitorTier | null
  is_active: boolean
  /** True for rows that exist solely as FK targets (operating_carrier_id) for partner_redemptions. Excluded from refresh queue + admin completeness UI. */
  is_reference_stub: boolean
  description: string | null
  logo_url: string | null
  program_url: string | null
  intro: string | null
  award_chart: string | null
  /**
   * INBOUND partners: programs that transfer points/miles INTO this one.
   * Populated for closed-loop airline co-brand programs (Southwest, Delta,
   * AA, United, JetBlue, etc.) where the editorial value is "how to earn
   * these points". Empty for transferable currencies + hotels — their
   * outbound destinations live on `transfer_partners_outbound` instead.
   * See migration 301 for the data model split.
   */
  transfer_partners: TransferPartnerRow[] | null
  /**
   * OUTBOUND partners: programs that THIS program transfers points OUT to.
   * Populated for transferable card currencies (UR, MR, TY, Cap1, Bilt),
   * hotel chains (Marriott, Hilton, Hyatt, IHG, Choice, Wyndham), and the
   * Avios family. Empty for closed-loop airline programs.
   */
  transfer_partners_outbound: TransferPartnerRow[] | null
  sweet_spots: string | null
  marquee_redemption_id: string | null
  marquee_pitch: string | null
  marquee_pitch_source_url: string | null
  quirks: string | null
  how_to_spend: string | null
  tier_benefits: TierBenefitRow[] | null
  lounge_access: string | null
  alliance: Alliance | null
  hubs: string[] | null
  member_programs: MemberProgramRow[] | null
  content_updated_at: string | null
  notes: string | null
  last_verified: string | null
  /** Noun used for the program's currency in headings: "miles" (default) or "points" for revenue-based programs (Southwest, JetBlue). */
  currency_term: 'miles' | 'points'
  /** True for flexible currencies (UR, MR, TY, Cap1, Bilt). False for co-brand or terminal currencies. */
  is_transferable_currency: boolean
  /** For joint-loyalty carriers (alaska→atmos, air_france→flying_blue):
   *  slug of the program holding transfer partners and status content.
   *  Null for standalone programs. */
  parent_program_slug: string | null
  /** Operator-level partner saver-access tier. Drives the Ways To Book section. */
  partner_access:
    | 'YES_STRONG'
    | 'YES_LIMITED'
    | 'YES_RESTRICTED'
    | 'HYBRID'
    | 'NO'
    | null
  partner_access_notes: string | null
  /** Deep-link template for the operator's award search ({origin}/{destination}/{date}). */
  saver_search_url_template: string | null
  /** Official program-domain URL for the award chart, when one exists.
   *  Surfaced as "Official chart ↗" link on SweetSpotCard + as a "View
   *  official rates" link on the public ActivePromosSection. NULL for
   *  programs with no public chart (dynamic pricing). */
  partner_chart_url: string | null
  /** Curator-authored override for the auto-generated "stack" callout on
   *  /programs/[slug] Live Now hero (Migration 253). When set, replaces
   *  the auto-computed text. NULL = use auto-generated. */
  stack_note_override: string | null
  created_at: string
  updated_at: string
}

export interface AlertProgram {
  id: string
  alert_id: string
  program_id: string
  role: string
  created_at: string
}

export type AlertWithPrograms = Alert & {
  alert_programs: (AlertProgram & { programs: Program })[]
}

export type AlertInsert = Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'computed_score' | 'score_last_computed_at' | 'approved_at' | 'source_intel_id' | 'fact_check_claims' | 'fact_check_at' | 'revision_log' | 'decided_at' | 'revisit_after' | 'rejected_reason' | 'why_this_matters' | 'override_reason' | 'voice_checked_at' | 'voice_pass' | 'voice_notes' | 'originality_checked_at' | 'originality_pass' | 'originality_notes' | 'short_slug' | 'voice_score' | 'voice_lead_mode' | 'terms_waived_reason' | 'context_loaded_at'>

// Phase 2 — decision memory.
// How long Scout suppresses similar findings after each decision, in days.
// Soft-rejected uses the per-row `revisit_after` instead of a fixed TTL.
const DEDUP_TTL_DAYS = {
  published: 30,
  rejected: 14,
} as const

export type DecisionMatch = {
  block: boolean
  reason: 'pending_review' | 'published' | 'rejected' | 'soft_rejected'
  alert: Pick<Alert, 'id' | 'title' | 'status' | 'decided_at' | 'revisit_after' | 'rejected_reason'>
}

/**
 * Looks up the most recent alert decision for a program+type combo and
 * decides whether a new intel finding should be suppressed. Used by Scout
 * to prevent re-staging stories you've already seen, and by build-brief
 * to feed Sonnet the rejection memory.
 *
 * Returns the most recent BLOCKING decision (highest priority: pending_review,
 * then published, then soft_rejected, then rejected — measured by decided_at
 * within each TTL). Returns null if nothing applies.
 */
export async function getRecentDecisionFor(
  supabase: SupabaseClient,
  programId: string | null,
  alertType: AlertType | null,
): Promise<DecisionMatch | null> {
  if (!programId || !alertType) return null

  const now = Date.now()
  const publishedCutoff = new Date(now - DEDUP_TTL_DAYS.published * 24 * 60 * 60 * 1000).toISOString()
  const rejectedCutoff = new Date(now - DEDUP_TTL_DAYS.rejected * 24 * 60 * 60 * 1000).toISOString()
  const nowIso = new Date(now).toISOString()

  const { data } = await supabase
    .from('alerts')
    .select('id, title, status, decided_at, revisit_after, rejected_reason')
    .eq('primary_program_id', programId)
    .eq('type', alertType)
    .order('decided_at', { ascending: false, nullsFirst: false })
    .limit(20)

  if (!data || data.length === 0) return null

  for (const row of data) {
    const a = row as DecisionMatch['alert']
    const status = (a.status as unknown) as string
    if (status === 'pending_review') {
      return { block: true, reason: 'pending_review', alert: a }
    }
    if (status === 'published' && a.decided_at && a.decided_at >= publishedCutoff) {
      return { block: true, reason: 'published', alert: a }
    }
    if (status === 'soft_rejected' && a.revisit_after && a.revisit_after > nowIso) {
      return { block: true, reason: 'soft_rejected', alert: a }
    }
    if (status === 'rejected' && a.decided_at && a.decided_at >= rejectedCutoff) {
      return { block: true, reason: 'rejected', alert: a }
    }
  }
  return null
}
export type AlertUpdate = Partial<Omit<Alert, 'id' | 'created_at' | 'updated_at'>>

export interface AlertHistory {
  id: string
  alert_id: string
  event: string
  title: string | null
  type: AlertType | null
  status: AlertStatus | null
  start_date: string | null
  end_date: string | null
  confidence_level: ConfidenceLevel | null
  source_url: string | null
  primary_program_id: string | null
  ai_summary: string | null
  created_at: string
}

export type AlertHistoryInsert = Omit<AlertHistory, 'id' | 'created_at'>

export type IntelSourceType = 'official' | 'blog' | 'reddit' | 'social'
export type IntelConfidence = 'high' | 'medium' | 'low'

export interface IntelItem {
  id: string
  created_at: string
  source_url: string | null
  source_type: IntelSourceType
  source_name: string
  raw_text: string | null
  headline: string
  confidence: IntelConfidence
  alert_type: AlertType | null
  programs: string[] | null
  expires_at: string | null
  processed: boolean
  alert_id: string | null
  dedup_count: number
  rejected_at: string | null
}

export type RecentIntelItem = Pick<IntelItem, 'id' | 'headline' | 'source_type' | 'programs' | 'alert_type' | 'created_at'>

export type IntelItemInsert = Omit<IntelItem, 'id' | 'created_at' | 'processed' | 'alert_id' | 'dedup_count' | 'rejected_at'>

// ─── Topics + content variants (content system rehaul, PR 1) ────────────────
// See plans/content-system-rehaul.md. Schema lives in supabase/migrations
// 297 (topics), 298 (content_variants), 299 (indexes).

export type TopicStatus = 'draft' | 'active' | 'archived'

export type FactCheckStatus =
  | 'pending'
  | 'verified'
  | 'partially_verified'
  | 'failed'

export type TopicType =
  | 'promo'
  | 'devaluation'
  | 'sweet_spot'
  | 'program_change'
  | 'partner_change'
  | 'category_change'
  | 'earn_rate_change'
  | 'status_change'
  | 'policy_change'
  | 'industry_news'
  | 'signup_bonus'
  | 'referral_bonus'
  | 'retention_offer'
  | 'shopping_portal_bonus'
  | 'award_sale'
  | 'companion_pass'
  | 'dining_bonus'
  | 'fee_change'
  | 'card_refresh'
  | 'milestone_bonus'
  | 'card_credit'
  | 'limited_time_offer'
  | 'award_availability'
  | 'status_promo'
  | 'glitch'
  | 'transfer_bonus'
  | 'other'

export interface FactLedgerEntry {
  claim: string
  category: string | null
  source_url: string
  source_quote: string
  confidence: ConfidenceLevel
  verified_at: string
  verified_by: string | null
}

export interface Topic {
  id: string
  slug: string
  title: string
  summary: string | null
  source_markdown: string | null
  source_urls: string[]
  fact_ledger: FactLedgerEntry[]
  fact_check_status: FactCheckStatus
  verified_at: string | null
  verified_by: string | null
  programs: string[]
  cards: string[]
  topic_type: TopicType
  end_date: string | null
  status: TopicStatus
  created_by: string
  created_at: string
  updated_at: string
}

export type TopicInsert = Omit<Topic, 'id' | 'created_at' | 'updated_at'>
export type TopicUpdate = Partial<Omit<Topic, 'id' | 'created_at' | 'updated_at'>>

export type VariantFormat =
  | 'alert'
  | 'blog'
  | 'newsletter'
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'linkedin'
  | 'threads'

export type VariantStatus =
  | 'draft'
  | 'needs_review'
  | 'approved'
  | 'published'
  | 'archived'

export type VariantGeneratedBy = 'sonnet' | 'haiku' | 'editor'

export interface FactCheckResults {
  confirmed: string[]
  corrected: string[]
  unverifiable: string[]
}

export interface ContentVariant {
  id: string
  topic_id: string
  format: VariantFormat
  title: string | null
  body: string | null
  metadata: Record<string, unknown>
  brand_voice_run: boolean
  fact_check_run: boolean
  fact_check_results: FactCheckResults | null
  status: VariantStatus
  published_at: string | null
  publish_target_url: string | null
  generated_by: VariantGeneratedBy | null
  generation_prompt_version: string | null
  created_at: string
  updated_at: string
}

export type ContentVariantInsert = Omit<ContentVariant, 'id' | 'created_at' | 'updated_at'>
export type ContentVariantUpdate = Partial<Omit<ContentVariant, 'id' | 'topic_id' | 'created_at' | 'updated_at'>>

// ─── Topic queries ───────────────────────────────────────────────────────────

export async function listTopics(
  supabase: SupabaseClient,
  filters: {
    status?: TopicStatus
    topic_type?: TopicType
    program?: string
  } = {},
): Promise<Array<Topic & { variant_count: number }>> {
  let q = supabase
    .from('topics')
    .select('*')
    .order('updated_at', { ascending: false })
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.topic_type) q = q.eq('topic_type', filters.topic_type)
  if (filters.program) q = q.contains('programs', [filters.program])
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const topics = (data ?? []) as Topic[]
  if (topics.length === 0) return []

  // Pull variant counts in one query.
  const ids = topics.map((t) => t.id)
  const { data: variants, error: vErr } = await supabase
    .from('content_variants')
    .select('topic_id')
    .in('topic_id', ids)
  if (vErr) throw new Error(vErr.message)
  const counts = new Map<string, number>()
  for (const row of (variants ?? []) as Array<{ topic_id: string }>) {
    counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1)
  }
  return topics.map((t) => ({ ...t, variant_count: counts.get(t.id) ?? 0 }))
}

export async function getTopicBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<Topic | null> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Topic | null) ?? null
}

export async function createTopic(
  supabase: SupabaseClient,
  input: TopicInsert,
): Promise<Topic> {
  const { data, error } = await supabase
    .from('topics')
    .insert(input)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Topic
}

export async function updateTopic(
  supabase: SupabaseClient,
  id: string,
  input: TopicUpdate,
): Promise<Topic> {
  const { data, error } = await supabase
    .from('topics')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Topic
}

// ─── Content variant queries (PR 3) ──────────────────────────────────────────

export async function listVariantsForTopic(
  supabase: SupabaseClient,
  topicId: string,
): Promise<ContentVariant[]> {
  const { data, error } = await supabase
    .from('content_variants')
    .select('*')
    .eq('topic_id', topicId)
  if (error) throw new Error(error.message)
  return (data ?? []) as ContentVariant[]
}

export async function getVariant(
  supabase: SupabaseClient,
  topicId: string,
  format: VariantFormat,
): Promise<ContentVariant | null> {
  const { data, error } = await supabase
    .from('content_variants')
    .select('*')
    .eq('topic_id', topicId)
    .eq('format', format)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as ContentVariant | null) ?? null
}

/**
 * Upsert a variant row keyed on (topic_id, format). On conflict update body /
 * title / metadata / status / generation provenance.
 */
export async function upsertVariant(
  supabase: SupabaseClient,
  input: ContentVariantInsert,
): Promise<ContentVariant> {
  const { data, error } = await supabase
    .from('content_variants')
    .upsert(input, { onConflict: 'topic_id,format' })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ContentVariant
}

export async function updateVariant(
  supabase: SupabaseClient,
  id: string,
  patch: ContentVariantUpdate,
): Promise<ContentVariant> {
  const { data, error } = await supabase
    .from('content_variants')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ContentVariant
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch all non-expired, published alerts ordered by soonest expiry then
 * highest computed score.
 */
export async function getActiveAlerts(supabase: SupabaseClient): Promise<AlertWithPrograms[]> {
  // Two-step expiry filter:
  //   1. SQL: permissive cutoff = now - 36h. Pulls anything that COULD still
  //      be active in ET (handles end_date stored as midnight UTC, which
  //      reads as the previous day in ET).
  //   2. JS: strict ET-based check via isAlertActiveET. An alert with
  //      end_date "May 1" stays active through end of May 1 ET and
  //      disappears at midnight ET May 2.
  // See lib/alerts/expiry.ts for rationale.
  const { permissiveActiveCutoffISO, isAlertActiveET } = await import('@/lib/alerts/expiry')
  const cutoff = permissiveActiveCutoffISO()

  const { data, error } = await supabase
    .from('alerts')
    .select('*, alert_programs(*, programs(*))')
    .eq('status', 'published' satisfies AlertStatus)
    .or(`end_date.is.null,end_date.gte.${cutoff}`)
    .order('end_date', { ascending: true, nullsFirst: false })
    .order('computed_score', { ascending: false, nullsFirst: false })

  if (error) throw error
  const rows = data as AlertWithPrograms[]
  return rows.filter((a) => isAlertActiveET(a.end_date))
}

/**
 * Fetch a single alert by id, including all joined program data via
 * alert_programs.
 */
export async function getAlertById(
  supabase: SupabaseClient,
  id: string
): Promise<AlertWithPrograms> {
  const { data, error } = await supabase
    .from('alerts')
    .select(`
      *,
      alert_programs (
        *,
        programs (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as AlertWithPrograms
}

/**
 * Fetch all alerts associated with a specific program (via alert_programs
 * junction table or primary_program_id).
 */
export async function getAlertsByProgram(
  supabase: SupabaseClient,
  programId: string
): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select(`
      *,
      alert_programs!inner (program_id)
    `)
    .eq('alert_programs.program_id', programId)
    .order('computed_score', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data as Alert[]
}

/**
 * Fetch all alerts regardless of status, ordered by most recently updated.
 * Used by the admin alerts list.
 */
export async function getAllAlerts(supabase: SupabaseClient): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as Alert[]
}

export type AlertWithIntel = Alert & {
  intel: Pick<IntelItem, 'source_name' | 'source_type' | 'confidence' | 'raw_text' | 'source_url'> | null
}

export async function getPendingReviewAlerts(supabase: SupabaseClient): Promise<AlertWithIntel[]> {
  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!alerts || alerts.length === 0) return []

  const intelIds = alerts.map((a) => a.source_intel_id).filter(Boolean)

  if (intelIds.length === 0) {
    return alerts.map((a) => ({ ...a, intel: null }))
  }

  const { data: intelItems } = await supabase
    .from('intel_items')
    .select('id, source_name, source_type, confidence, raw_text, source_url')
    .in('id', intelIds)

  const intelMap = new Map((intelItems ?? []).map((i) => [i.id, i]))

  return alerts.map((a) => ({
    ...a,
    intel: a.source_intel_id ? (intelMap.get(a.source_intel_id) ?? null) : null,
  }))
}

/**
 * Fetch all active programs, ordered by name.
 */
export async function getPrograms(supabase: SupabaseClient): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('id, slug, name, type')
    .order('name', { ascending: true })

  if (error) throw error
  return data as Program[]
}

/**
 * Insert a new alert row and return the created record.
 */
export async function createAlert(
  supabase: SupabaseClient,
  alertData: AlertInsert
): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .insert(alertData)
    .select()
    .single()

  if (error) throw error
  return data as Alert
}

/**
 * Update an existing alert by id and return the updated record.
 */
export async function updateAlert(
  supabase: SupabaseClient,
  id: string,
  alertData: AlertUpdate
): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .update({ ...alertData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Alert
}

/**
 * Insert a row into alert_history and return the created record.
 * Use createAdminClient() to bypass RLS.
 */
export async function logAlertHistory(
  supabase: SupabaseClient,
  data: AlertHistoryInsert
): Promise<AlertHistory> {
  const { data: row, error } = await supabase
    .from('alert_history')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return row as AlertHistory
}

/**
 * Mark an alert as expired by setting end_date to now.
 * No dedicated `expired` boolean exists in the schema — end_date is the
 * canonical expiry signal used by getActiveAlerts.
 */
export async function expireAlert(
  supabase: SupabaseClient,
  id: string
): Promise<Alert> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('alerts')
    .update({ status: 'expired' satisfies AlertStatus, end_date: now, updated_at: now })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Alert
}

/**
 * Fetch all sources with their feed count, ordered by tier then name.
 */
export async function getSources(supabase: SupabaseClient): Promise<SourceWithFeedCount[]> {
  const { data, error } = await supabase
    .from('sources')
    .select(`
      *,
      source_feeds (id)
    `)
    .order('tier', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: Source & { source_feeds: { id: string }[] }) => ({
    ...row,
    feed_count: row.source_feeds?.length ?? 0,
  }))
}

export async function listAlertsWithFactChecks(
  supabase: SupabaseClient,
  opts: { days?: number } = {},
): Promise<Pick<Alert, 'id' | 'title' | 'status' | 'fact_check_claims' | 'fact_check_at' | 'approved_at' | 'created_at'>[]> {
  const cutoff = new Date(Date.now() - (opts.days ?? 30) * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('alerts')
    .select('id, title, status, fact_check_claims, fact_check_at, approved_at, created_at')
    .not('fact_check_at', 'is', null)
    .gte('fact_check_at', cutoff)
    .order('fact_check_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []) as Pick<Alert, 'id' | 'title' | 'status' | 'fact_check_claims' | 'fact_check_at' | 'approved_at' | 'created_at'>[]
}

export async function getLastFindingBySource(
  supabase: SupabaseClient,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('intel_items')
    .select('source_name, created_at')
    .order('created_at', { ascending: false })
    .limit(2000)
  if (error) return new Map()
  const map = new Map<string, string>()
  for (const row of (data ?? []) as { source_name: string; created_at: string }[]) {
    if (!map.has(row.source_name)) map.set(row.source_name, row.created_at)
  }
  return map
}

export type SourceInsert = {
  name: string
  url: string
  type: SourceType
  tier: number
  is_active?: boolean
  scrape_frequency?: string
  notes?: string | null
  use_firecrawl?: boolean
}

// ── Subscribers ──────────────────────────────────────────────────────────

export type Subscriber = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  active: boolean
}

export async function listSubscribers(supabase: SupabaseClient): Promise<Subscriber[]> {
  const { data, error } = await supabase
    .from('subscribers')
    .select('id, email, first_name, last_name, active')
    .order('email', { ascending: true })
  if (error) throw error
  return (data ?? []) as Subscriber[]
}

export async function setSubscriberActive(
  supabase: SupabaseClient,
  id: string,
  active: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('subscribers')
    .update({ active })
    .eq('id', id)
  if (error) throw error
}

/**
 * Insert a new subscriber. Returns the new row, or throws if the email is
 * already in the table (unique constraint). Active defaults to true so the
 * subscriber is ready to receive the next newsletter immediately.
 */
export async function addSubscriber(
  supabase: SupabaseClient,
  payload: { email: string; first_name?: string | null; last_name?: string | null; active?: boolean },
): Promise<Subscriber> {
  const { data, error } = await supabase
    .from('subscribers')
    .insert({
      email: payload.email.trim().toLowerCase(),
      first_name: payload.first_name?.trim() || null,
      last_name: payload.last_name?.trim() || null,
      active: payload.active ?? true,
    })
    .select('id, email, first_name, last_name, active')
    .single()
  if (error) throw error
  return data as Subscriber
}

// ── System Errors ────────────────────────────────────────────────────────

export type SystemError = {
  id: string
  source: string
  message: string
  stack: string | null
  context: unknown
  created_at: string
  resolved_at: string | null
}

// Swallows failures so logging never breaks the caller (e.g. if table is missing).
export async function logSystemError(
  supabase: SupabaseClient,
  source: string,
  err: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  // Supabase/Postgrest errors are plain objects — `String({})` gives "[object Object]".
  // Extract .message if present, stash the full shape in context.error for debugging.
  let message: string
  let extra: Record<string, unknown> | null = null
  if (err instanceof Error) {
    message = err.message
  } else if (err && typeof err === 'object') {
    const e = err as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown }
    message = typeof e.message === 'string' && e.message
      ? e.message
      : (() => {
          try { return JSON.stringify(err) } catch { return '[unserializable error]' }
        })()
    extra = { code: e.code ?? null, details: e.details ?? null, hint: e.hint ?? null }
  } else {
    message = String(err)
  }
  const stack = err instanceof Error ? err.stack ?? null : null
  const mergedContext = extra
    ? { ...(context ?? {}), error: extra }
    : context ?? null
  try {
    await supabase.from('system_errors').insert({
      source,
      message,
      stack,
      context: mergedContext,
    })
  } catch {
    // intentional: logging path must never throw
  }
}

export async function listSystemErrors(
  supabase: SupabaseClient,
  opts: { onlyUnresolved?: boolean; limit?: number } = {},
): Promise<SystemError[]> {
  let q = supabase
    .from('system_errors')
    .select('id, source, message, stack, context, created_at, resolved_at')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 100)
  if (opts.onlyUnresolved) q = q.is('resolved_at', null)
  const { data, error } = await q
  if (error) {
    const code = (error as { code?: string }).code
    if (code === '42P01' || code === 'PGRST205') return []
    throw error
  }
  return (data ?? []) as SystemError[]
}

export async function countUnresolvedSystemErrors(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('system_errors')
    .select('id', { count: 'exact', head: true })
    .is('resolved_at', null)
  if (error) return 0
  return count ?? 0
}

export async function resolveSystemError(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('system_errors')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ── Intel Items (admin viewer) ───────────────────────────────────────────

export type IntelStatusFilter = 'all' | 'unprocessed' | 'staged' | 'rejected'
export type IntelWindow = '24h' | '7d' | '30d' | 'all'

export interface IntelFilters {
  window?: IntelWindow
  confidence?: IntelConfidence | 'all'
  status?: IntelStatusFilter
  source?: string | 'all'
}

function windowCutoff(w: IntelWindow): string | null {
  if (w === 'all') return null
  const hours = w === '24h' ? 24 : w === '7d' ? 24 * 7 : 24 * 30
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export async function listIntelItems(
  supabase: SupabaseClient,
  filters: IntelFilters = {},
): Promise<IntelItem[]> {
  const { window = '24h', confidence = 'all', status = 'all', source = 'all' } = filters
  let q = supabase
    .from('intel_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const cutoff = windowCutoff(window)
  if (cutoff) q = q.gte('created_at', cutoff)
  if (confidence !== 'all') q = q.eq('confidence', confidence)
  if (source !== 'all') q = q.eq('source_name', source)

  if (status === 'unprocessed') q = q.eq('processed', false).is('rejected_at', null)
  else if (status === 'staged') q = q.eq('processed', true)
  else if (status === 'rejected') q = q.not('rejected_at', 'is', null)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as IntelItem[]
}

export async function listIntelSourceNames(supabase: SupabaseClient): Promise<string[]> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('intel_items')
    .select('source_name')
    .gte('created_at', cutoff)
  if (error) return []
  const set = new Set<string>()
  for (const row of data ?? []) set.add((row as { source_name: string }).source_name)
  return Array.from(set).sort()
}

export async function rejectIntelItem(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('intel_items')
    .update({ rejected_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function unrejectIntelItem(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('intel_items')
    .update({ rejected_at: null })
    .eq('id', id)
  if (error) throw error
}

export async function getSourceById(
  supabase: SupabaseClient,
  id: string
): Promise<Source | null> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return (data as Source) ?? null
}

export type SourceUpdate = Partial<SourceInsert>

export async function updateSource(
  supabase: SupabaseClient,
  id: string,
  patch: SourceUpdate
): Promise<Source> {
  const { data, error } = await supabase
    .from('sources')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Source
}

export async function createSource(
  supabase: SupabaseClient,
  input: SourceInsert
): Promise<Source> {
  const { data, error } = await supabase
    .from('sources')
    .insert({
      is_active: true,
      scrape_frequency: 'daily',
      use_firecrawl: false,
      ...input,
    })
    .select()
    .single()

  if (error) throw error
  return data as Source
}

/**
 * Toggle the is_active flag on a source.
 */
export async function toggleSourceActive(
  supabase: SupabaseClient,
  id: string,
  is_active: boolean
): Promise<void> {
  const { error } = await supabase
    .from('sources')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteSourceById(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('sources')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Fetch all programs with all columns, ordered by type then name.
 * Used by the admin programs list.
 */
export async function getAllPrograms(supabase: SupabaseClient): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data as Program[]
}

/**
 * Fetch a single published alert by slug. Falls back to short_slug match
 * so legacy /alerts/<short_slug> links keep working (the LiveBarsHero used
 * to render short_slug URLs into the /alerts/ route before the 2026-05-18
 * fix; this fallback prevents dead-link bookmarks/external shares).
 */
export async function getAlertBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Alert> {
  // Primary lookup — exact slug match.
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published' satisfies AlertStatus)
    .maybeSingle()

  if (data) return data as Alert
  if (error) throw error

  // Fallback — short_slug match (legacy URLs).
  const { data: shortMatch, error: shortErr } = await supabase
    .from('alerts')
    .select('*')
    .eq('short_slug', slug)
    .eq('status', 'published' satisfies AlertStatus)
    .maybeSingle()

  if (shortErr) throw shortErr
  if (!shortMatch) throw new Error('Alert not found')
  return shortMatch as Alert
}

/**
 * Fetch active (published, not expired) alerts with optional type and
 * program filters. Checks both primary_program_id and the alert_programs
 * junction table so all linked alerts appear. Used by the public /alerts page.
 */
export async function getActiveAlertsByFilter(
  supabase: SupabaseClient,
  type?: string | null,
  programId?: string | null
): Promise<AlertWithPrograms[]> {
  // Same two-step expiry semantics as getActiveAlerts — see lib/alerts/expiry.ts.
  const { permissiveActiveCutoffISO, isAlertActiveET } = await import('@/lib/alerts/expiry')
  const cutoff = permissiveActiveCutoffISO()

  // When filtering by program, resolve all alert_ids linked via junction table
  let junctionIds: string[] = []
  if (programId) {
    const { data: junction, error: jError } = await supabase
      .from('alert_programs')
      .select('alert_id')
      .eq('program_id', programId)

    if (jError) throw jError
    junctionIds = (junction ?? []).map((r: { alert_id: string }) => r.alert_id)
  }

  let query = supabase
    .from('alerts')
    .select('*, alert_programs(*, programs(*))')
    .eq('status', 'published' satisfies AlertStatus)
    .or(`end_date.is.null,end_date.gte.${cutoff}`)

  if (type) query = query.eq('type', type)

  if (programId) {
    if (junctionIds.length > 0) {
      query = query.or(`primary_program_id.eq.${programId},id.in.(${junctionIds.join(',')})`)
    } else {
      query = query.eq('primary_program_id', programId)
    }
  }

  query = query
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('computed_score', { ascending: false, nullsFirst: false })

  const { data, error } = await query
  if (error) throw error
  const rows = data as AlertWithPrograms[]
  return rows.filter((a) => isAlertActiveET(a.end_date))
}

/**
 * Fetch alerts published on a specific calendar date (UTC).
 * Used by the /daily-brief/[date] archive page.
 */
export async function getAlertsByPublishDate(
  supabase: SupabaseClient,
  dateStr: string // YYYY-MM-DD
): Promise<AlertWithPrograms[]> {
  const start = `${dateStr}T00:00:00.000Z`
  const end   = `${dateStr}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('alerts')
    .select('*, alert_programs(*, programs(*))')
    .eq('status', 'published' satisfies AlertStatus)
    .gte('published_at', start)
    .lte('published_at', end)
    .order('computed_score', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data as AlertWithPrograms[]
}

/**
 * Fetch the program_ids currently tagged on an alert via alert_programs.
 */
export async function getAlertPrograms(
  supabase: SupabaseClient,
  alertId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('alert_programs')
    .select('program_id')
    .eq('alert_id', alertId)

  if (error) throw error
  return (data ?? []).map((r: { program_id: string }) => r.program_id)
}

/**
 * Replace all alert_programs rows for an alert. Always writes a 'primary' row
 * for the alert's primary program (auto-fetched from alerts.primary_program_id
 * if `primaryId` not provided) plus 'secondary' rows for each `secondaryIds`
 * entry. Deduplicates so a program tagged as both is only stored once
 * (as primary).
 *
 * Callers can either:
 *   • pass a flat `string[]` of secondary ids (legacy callers — primary is
 *     auto-fetched from the alert), or
 *   • pass `{ primaryId, secondaryIds }` to be fully explicit.
 *
 * Pass `{ primaryId: null, secondaryIds: [] }` (or `[]`) to clear, but the
 * auto-fetch path will still re-tag the primary unless explicitly cleared.
 */
export async function setAlertPrograms(
  supabase: SupabaseClient,
  alertId: string,
  arg: string[] | { primaryId?: string | null; secondaryIds?: string[] } = {}
): Promise<void> {
  const config = Array.isArray(arg) ? { secondaryIds: arg } : arg

  // Auto-fetch the primary if caller didn't specify one. Keeps the junction
  // consistent with alerts.primary_program_id without every call site needing
  // to know to pass it.
  let primaryId: string | null
  if (config.primaryId !== undefined) {
    primaryId = config.primaryId
  } else {
    const { data: alert } = await supabase
      .from('alerts')
      .select('primary_program_id')
      .eq('id', alertId)
      .single()
    primaryId = (alert?.primary_program_id as string | null) ?? null
  }

  const { error: deleteError } = await supabase
    .from('alert_programs')
    .delete()
    .eq('alert_id', alertId)
  if (deleteError) throw deleteError

  const seen = new Set<string>()
  const rows: { alert_id: string; program_id: string; role: 'primary' | 'secondary' }[] = []

  if (primaryId) {
    rows.push({ alert_id: alertId, program_id: primaryId, role: 'primary' })
    seen.add(primaryId)
  }
  for (const id of config.secondaryIds ?? []) {
    if (!id || seen.has(id)) continue
    rows.push({ alert_id: alertId, program_id: id, role: 'secondary' })
    seen.add(id)
  }

  if (rows.length === 0) return

  const { error: insertError } = await supabase.from('alert_programs').insert(rows)
  if (insertError) throw insertError
}

/**
 * Fetch all alerts associated with a program slug (via alert_programs or
 * primary_program_id). Returns all statuses — active, expired, draft — for
 * the public program page which archives everything permanently.
 */
export async function getAlertsByProgramSlug(
  supabase: SupabaseClient,
  programSlug: string
): Promise<{ program: Program; alerts: AlertWithPrograms[] }> {
  // Phase 3 Wave 2 flip #10: alerts portion read from content_variants +
  // topics via the AlertView adapter. Program resolution + alliance
  // expansion logic preserved exactly.
  const { selectAlertViewFromVariants } = await import('@/utils/content/alertView')

  // 1. Resolve the program
  const { data: program, error: progError } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', programSlug)
    .single()

  if (progError) throw progError

  // 2. Determine the set of program slugs whose alerts should appear on this page.
  //    Alliance pages aggregate alerts from every member airline (programs whose
  //    `alliance` column matches this slug). Carrier / hotel / loyalty pages
  //    just use their own slug.
  let targetSlugs: Set<string> = new Set([program.slug])
  if (program.type === 'alliance') {
    const { data: members, error: mError } = await supabase
      .from('programs')
      .select('slug')
      .eq('alliance', program.slug)
    if (mError) throw mError
    for (const m of (members ?? []) as { slug: string }[]) targetSlugs.add(m.slug)
  }

  // 3. Fetch all published variants with joined programs, then filter to
  //    those tagged with any of the target slugs. Result set is small so
  //    client-side filter is fine.
  const allPublished = await selectAlertViewFromVariants(supabase, { status: 'published', withPrograms: true })
  const alerts = (allPublished as (Alert & { alert_programs: (AlertProgram & { programs: Program })[] })[])
    .filter((a) => a.alert_programs.some((ap) => targetSlugs.has(ap.programs.slug)))
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))

  return { program: program as Program, alerts }
}

/**
 * Build an alliance-context block for the writer + fact-checker.
 *
 * Given a list of program IDs, find any whose `alliance` column is set,
 * fetch each unique alliance program row, and return a markdown context
 * string that includes the alliance's intro, sweet spots, lounge access,
 * tier benefits, member airlines, and quirks. Returns null when none of
 * the input programs are aligned (so the prompt can omit the section
 * entirely).
 *
 * The writer uses this for sweet-spot ideas and on-brand tangents; the
 * fact-checker uses it to validate alliance-wide claims (lounge rules,
 * tier crossover, RTW products). Always defer to the carrier's own page
 * when the carrier and alliance disagree — the alliance block is
 * supplementary context, not authoritative for carrier-specific facts.
 */
export async function loadAllianceContextForPrograms(
  supabase: SupabaseClient,
  programIds: string[]
): Promise<string | null> {
  if (programIds.length === 0) return null

  const { data: programs, error } = await supabase
    .from('programs')
    .select('alliance')
    .in('id', programIds)
    .not('alliance', 'is', null)
    .neq('alliance', 'none')
    .neq('alliance', 'other')
  if (error) return null
  if (!programs || programs.length === 0) return null

  const allianceSlugs = Array.from(
    new Set(programs.map((p: { alliance: string | null }) => p.alliance).filter(Boolean) as string[])
  )
  if (allianceSlugs.length === 0) return null

  const { data: allianceRows, error: aErr } = await supabase
    .from('programs')
    .select('slug, name, intro, sweet_spots, lounge_access, quirks, member_programs, tier_benefits')
    .eq('type', 'alliance')
    .in('slug', allianceSlugs)
  if (aErr || !allianceRows || allianceRows.length === 0) return null

  const blocks = allianceRows.map((row: {
    slug: string
    name: string
    intro: string | null
    sweet_spots: string | null
    lounge_access: string | null
    quirks: string | null
    member_programs: MemberProgramRow[] | null
    tier_benefits: TierBenefitRow[] | null
  }) => {
    const parts: string[] = [`## ${row.name} (alliance: ${row.slug})`]
    if (row.intro?.trim()) parts.push(`### Intro\n${row.intro.trim()}`)
    if (row.sweet_spots?.trim()) parts.push(`### Sweet spots\n${row.sweet_spots.trim()}`)
    if (row.lounge_access?.trim()) parts.push(`### Lounge access\n${row.lounge_access.trim()}`)
    if ((row.tier_benefits?.length ?? 0) > 0) {
      const tiers = row.tier_benefits!
        .map((t) => `- **${t.name}** (${t.qualification}): ${t.benefits.slice(0, 4).join('; ')}${t.benefits.length > 4 ? '; ...' : ''}`)
        .join('\n')
      parts.push(`### Tier crossover\n${tiers}`)
    }
    if ((row.member_programs?.length ?? 0) > 0) {
      const members = row.member_programs!
        .map((m) => `- ${m.program_slug}${(m.carrier_slugs?.length ?? 0) > 0 ? ` (carriers: ${m.carrier_slugs!.join(', ')})` : ''}`)
        .join('\n')
      parts.push(`### Member airlines\n${members}`)
    }
    if (row.quirks?.trim()) parts.push(`### Quirks\n${row.quirks.trim()}`)
    return parts.join('\n\n')
  })

  return blocks.join('\n\n---\n\n')
}

/**
 * Fetch intel_items created within the last N days, returning only the fields
 * needed for cross-day dedup and confidence-boost checks.
 */
export async function getRecentIntelItems(
  supabase: SupabaseClient,
  days = 7
): Promise<RecentIntelItem[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('intel_items')
    .select('id, headline, source_type, programs, alert_type, created_at')
    .gte('created_at', since)
  if (error) throw error
  return (data ?? []) as RecentIntelItem[]
}

/**
 * Increment items_produced (and update last_scraped_at) for a source by name.
 * Uses the increment_source_produced RPC to avoid a read-modify-write race.
 */
export async function incrementSourceProduced(
  supabase: SupabaseClient,
  sourceName: string,
  count: number
): Promise<void> {
  await supabase.rpc('increment_source_produced', {
    p_source_name: sourceName,
    p_count: count,
  })
}

/**
 * Increment items_approved for the source that produced a given intel_item.
 * Uses the increment_source_approved RPC which joins on source_name.
 */
export async function incrementSourceApproved(
  supabase: SupabaseClient,
  intelItemId: string
): Promise<void> {
  await supabase.rpc('increment_source_approved', { p_intel_id: intelItemId })
}

/**
 * Toggle the is_active flag on a program.
 */
export async function toggleProgramActive(
  supabase: SupabaseClient,
  id: string,
  is_active: boolean
): Promise<void> {
  const { error } = await supabase
    .from('programs')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function createProgram(
  supabase: SupabaseClient,
  input: {
    slug: string
    name: string
    type: ProgramType
    tier?: string | null
    monitor_tier?: MonitorTier | null
    program_url?: string | null
  }
): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .insert({
      slug: input.slug,
      name: input.name,
      type: input.type,
      tier: input.tier ?? null,
      monitor_tier: input.monitor_tier ?? null,
      program_url: input.program_url ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  return data as Program
}

export interface ProgramPageContentInput {
  intro: string | null
  award_chart: string | null
  transfer_partners: TransferPartnerRow[] | null
  sweet_spots: string | null
  /** Optional — curator-set via a separate path (Should I Transfer marquee). */
  marquee_redemption_id?: string | null
  /** Optional — one-sentence pitch surfaced under the marquee pick. */
  marquee_pitch?: string | null
  /** Optional — source URL gating marquee_pitch render. Required for pitch to display. */
  marquee_pitch_source_url?: string | null
  quirks: string | null
  how_to_spend: string | null
  tier_benefits: TierBenefitRow[] | null
  lounge_access: string | null
  alliance: Alliance | null
  hubs: string[] | null
  member_programs: MemberProgramRow[] | null
}

export async function updateProgramPageContent(
  supabase: SupabaseClient,
  id: string,
  input: ProgramPageContentInput
): Promise<void> {
  const anyContent =
    !!input.intro ||
    !!input.award_chart ||
    (input.transfer_partners?.length ?? 0) > 0 ||
    !!input.sweet_spots ||
    !!input.quirks ||
    !!input.how_to_spend ||
    (input.tier_benefits?.length ?? 0) > 0 ||
    !!input.lounge_access ||
    !!input.alliance ||
    (input.hubs?.length ?? 0) > 0 ||
    (input.member_programs?.length ?? 0) > 0
  const { error } = await supabase
    .from('programs')
    .update({
      intro: input.intro,
      award_chart: input.award_chart,
      transfer_partners: input.transfer_partners,
      sweet_spots: input.sweet_spots,
      quirks: input.quirks,
      how_to_spend: input.how_to_spend,
      tier_benefits: input.tier_benefits,
      lounge_access: input.lounge_access,
      alliance: input.alliance,
      hubs: input.hubs,
      member_programs: input.member_programs,
      content_updated_at: anyContent ? new Date().toISOString() : null,
      // Auto-bump last_verified on every save: the act of editing IS verification.
      // Drops the row out of the admin_refresh_queue view until next cadence cycle.
      last_verified: new Date().toISOString().slice(0, 10),
    })
    .eq('id', id)
  if (error) throw error
}

// ─── Hotel properties ────────────────────────────────────────────────────────
//
// Per-property data for hotel programs. See migrations/040_hotel_properties.sql.

export type HotelRegion = 'americas' | 'europe' | 'asia_pacific' | 'middle_east_africa'

export interface HotelProperty {
  id: string
  program_id: string
  created_at: string
  updated_at: string
  name: string
  brand: string | null
  city: string | null
  country: string | null
  region: HotelRegion | null
  category: string | null
  off_peak_points: number | null
  standard_points: number | null
  peak_points: number | null
  hotel_url: string | null
  all_inclusive: boolean
  notes: string | null
  last_verified: string | null
  category_next: string | null
  category_changes_at: string | null
}

export type HotelPropertyInsert = Omit<
  HotelProperty,
  'id' | 'created_at' | 'updated_at' | 'category_next' | 'category_changes_at'
> & {
  category_next?: string | null
  category_changes_at?: string | null
}

/**
 * Fetch all hotel properties for a given program, ordered by category then name.
 * Used by the public sortable list and by the writer pipeline as authoritative
 * reference data.
 */
export async function getPropertiesForProgram(
  supabase: SupabaseClient,
  programId: string
): Promise<HotelProperty[]> {
  // Supabase's default response cap is 1,000 rows. Hyatt alone has ~1,600
  // properties, so the cap was hiding ~600 rows from the admin table and
  // the public list. Pull in pages of 1,000 until we've drained the table.
  const PAGE = 1000
  const all: HotelProperty[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('hotel_properties')
      .select('*')
      .eq('program_id', programId)
      .order('category', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
      .range(from, from + PAGE - 1)

    if (error) throw error
    const rows = (data ?? []) as HotelProperty[]
    all.push(...rows)
    if (rows.length < PAGE) break
    from += PAGE
  }
  return all
}

/**
 * Insert one property row.
 */
export async function insertHotelProperty(
  supabase: SupabaseClient,
  row: HotelPropertyInsert
): Promise<HotelProperty> {
  const { data, error } = await supabase
    .from('hotel_properties')
    .insert(row)
    .select('*')
    .single()

  if (error) throw error
  return data as HotelProperty
}

/**
 * Bulk-insert with conflict handling on (program_id, lower(name)). Used by
 * the admin CSV importer. Existing rows are updated in place; new rows are
 * inserted. Returns counts so the importer can report what happened.
 */
export async function upsertHotelProperties(
  supabase: SupabaseClient,
  rows: HotelPropertyInsert[]
): Promise<{ inserted: number; updated: number }> {
  if (rows.length === 0) return { inserted: 0, updated: 0 }

  // Look up existing rows for this program by lowercased name to decide
  // insert-vs-update per row. The unique index is on lower(name), but
  // Supabase's upsert helper needs an actual unique constraint name —
  // we don't have one (we used a lower(name) index instead), so we do
  // the diff in app code.
  const programIds = new Set(rows.map((r) => r.program_id))
  if (programIds.size > 1) {
    throw new Error('upsertHotelProperties: rows must all share the same program_id')
  }
  const programId = rows[0].program_id
  const incomingByLower = new Map(rows.map((r) => [r.name.toLowerCase(), r]))

  const { data: existing, error: fetchErr } = await supabase
    .from('hotel_properties')
    .select('id, name')
    .eq('program_id', programId)
  if (fetchErr) throw fetchErr

  const existingByLower = new Map(
    (existing ?? []).map((r: { id: string; name: string }) => [r.name.toLowerCase(), r.id])
  )

  const toUpdate: Array<{ id: string; row: HotelPropertyInsert }> = []
  const toInsert: HotelPropertyInsert[] = []
  for (const [lowerName, row] of incomingByLower.entries()) {
    const existingId = existingByLower.get(lowerName)
    if (existingId) toUpdate.push({ id: existingId, row })
    else toInsert.push(row)
  }

  if (toInsert.length > 0) {
    const { error: insertErr } = await supabase.from('hotel_properties').insert(toInsert)
    if (insertErr) throw insertErr
  }

  for (const { id, row } of toUpdate) {
    const { error: updateErr } = await supabase
      .from('hotel_properties')
      .update(row)
      .eq('id', id)
    if (updateErr) throw updateErr
  }

  return { inserted: toInsert.length, updated: toUpdate.length }
}

/**
 * Update one row by id. Used by the per-row admin edit form.
 */
export async function updateHotelProperty(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<HotelPropertyInsert>
): Promise<void> {
  const { error } = await supabase
    .from('hotel_properties')
    .update({
      ...patch,
      // Auto-bump last_verified on every property save (unless caller explicitly set one).
      last_verified: patch.last_verified ?? new Date().toISOString().slice(0, 10),
    })
    .eq('id', id)
  if (error) throw error
}

/**
 * Delete one row by id.
 */
export async function deleteHotelPropertyById(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('hotel_properties')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Credit Cards ─────────────────────────────────────────────────────────
// See plans/credit-cards-architecture.md (Round 3) and migration 044.

export interface Issuer {
  id: string
  slug: string
  name: string
  logo_url: string | null
  intro: string | null
  website_url: string | null
  notes: string | null
  last_verified: string | null
  created_at: string
  updated_at: string
}

export type CardType = 'personal' | 'business'
export type CardTier = 'premium' | 'mid' | 'starter' | 'hotel_cobrand' | 'airline_cobrand' | 'business' | 'secured' | 'charge'
export type AffiliateNetwork = 'cj' | 'rakuten' | 'impact' | 'issuer_direct' | 'other'
export type CreditScoreRecommended = 'fair' | 'good' | 'excellent'

export interface CreditCard {
  id: string
  slug: string
  issuer_id: string
  name: string
  image_url: string | null
  intro: string | null
  official_url: string | null
  affiliate_url: string | null
  affiliate_network: AffiliateNetwork | null
  affiliate_id: string | null
  deep_link_template: string | null
  annual_fee_usd: number | null
  card_type: CardType
  card_tier: CardTier | null
  currency_program_id: string | null
  co_brand_program_id: string | null
  /** When true, the card transfers points directly to the airline/hotel
   * partners of its currency_program. When false (Freedom family, Ink Cash,
   * Citi Custom Cash, etc.), points must first be pooled into a higher-tier
   * sibling card to unlock transfers; the card-detail page hides the partner
   * table and shows a "pair with sibling" alert instead. */
  points_transferable_to_partners: boolean
  foreign_transaction_fee_pct: number | null
  chase_5_24_subject: boolean
  credit_score_recommended: CreditScoreRecommended | null
  /** Referral bonus per approved referral (e.g. 10000 miles per friend on the
   *  Chase United Business card). Null when the card has no referral program. */
  referral_bonus_amount: number | null
  /** Currency of the referral bonus — usually matches the card's earn currency
   *  ('miles' for airline cobrands, 'points' for UR cards, etc.). */
  referral_bonus_currency: string | null
  /** Annual cap on total referral bonuses earnable (e.g. 100000 miles per year). */
  referral_cap_per_year: number | null
  tags: string[]
  intended_user: string[]
  is_active: boolean
  notes: string | null
  last_verified: string | null
  /** Newline-separated bullets, each starting with "- ". Renders as a callout box on the card detail page above the intro. Required on every card per plans/credit-cards-architecture.md. */
  good_to_know: string | null
  /** When true, the card is grandfathered — issuer continues to service existing
   *  cardholders but no longer accepts new applications. Card page hides the
   *  Apply CTA and shows a "Closed to new applicants" banner. */
  closed_to_new_applicants: boolean
  created_at: string
  updated_at: string
}

export type EarnRateBookingChannel = 'direct' | 'portal' | 'any'
export type EarnRateCapPeriod = 'quarterly' | 'annual' | 'monthly' | 'lifetime'

export interface CreditCardEarnRate {
  id: string
  card_id: string
  category: string
  multiplier: number
  cap_amount_usd: number | null
  cap_period: EarnRateCapPeriod | null
  rotating: boolean
  booking_channel: EarnRateBookingChannel
  notes: string | null
  created_at: string
  updated_at: string
}

export type BenefitCategory =
  | 'statement_credit' | 'travel_credit' | 'lounge_access' | 'insurance'
  | 'free_night' | 'status_conferred' | 'protection' | 'spend_unlock'
  | 'portal_redemption' | 'transfer_partner_unlock' | 'other'

export type BenefitFrequency = 'per_trip' | 'annual' | 'anniversary' | 'monthly' | 'lifetime' | 'one_time' | 'quarterly' | 'semi_annual'
export type BenefitValueUnit = 'USD' | 'nights' | 'pct' | 'points' | 'miles' | 'points_per_dollar'

export interface CreditCardBenefit {
  id: string
  card_id: string
  category: BenefitCategory
  benefit_type: string // controlled list — see migration 044 CHECK; mirrored as KNOWN_BENEFIT_TYPES in admin
  name: string
  value_amount: number | null
  value_unit: BenefitValueUnit | null
  coverage_amount: number | null
  frequency: BenefitFrequency | null
  spend_threshold_usd: number | null
  description: string | null
  sort_order: number
  metadata: Record<string, unknown>
  /** Editorial estimate of realized annual USD value. Distinct from coverage_amount (a cap). */
  value_estimate_usd: number | null
  created_at: string
  updated_at: string
}

export interface CreditCardWelcomeBonus {
  id: string
  card_id: string
  bonus_amount: number
  bonus_currency: string
  spend_required_usd: number | null
  spend_window_months: number
  extras: string | null
  estimated_value_usd: number | null
  window_start: string | null
  window_end: string | null
  is_current: boolean
  source_url: string | null
  notes: string | null
  /** JSONB array of additional bonus tiers beyond the main offer (e.g. AU bonus).
   *  Each item shape: { spend_usd, bonus_amount, timeline_months, note? }.
   *  Total potential bonus = bonus_amount + sum of additional tiers that differ
   *  from the main offer. Used to render "Up to X total" on the public card page. */
  tiered_bonuses: Array<{
    spend_usd: number
    bonus_amount: number
    timeline_months: number
    note?: string
  }> | null
  /** True when the offer is flagged as elevated / limited-time. Renders a
   *  "🕐 LIMITED TIME" badge on the public card page regardless of whether
   *  baseline equals current. Sonnet sets this when it detects "LIMITED TIME"
   *  copy on the issuer's page. */
  is_elevated: boolean | null
  /** Baseline (non-elevated) offer amount, when the issuer page shows one.
   *  When null or equal to bonus_amount, no elevation math is shown. */
  baseline_bonus_amount: number | null
  created_at: string
  updated_at: string
}

export interface ProgramTransfer {
  id: string
  from_program_id: string
  to_program_id: string
  ratio: string
  bonus_active: boolean
  bonus_pct: number | null
  bonus_starts: string | null
  bonus_ends: string | null
  notes: string | null
  last_verified: string | null
  created_at: string
  updated_at: string
}

export type IssuerInsert            = Omit<Issuer, 'id' | 'created_at' | 'updated_at'>
export type CreditCardInsert        = Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>
export type CreditCardEarnRateInsert  = Omit<CreditCardEarnRate, 'id' | 'created_at' | 'updated_at'>
export type CreditCardBenefitInsert   = Omit<CreditCardBenefit, 'id' | 'created_at' | 'updated_at'>
export type CreditCardWelcomeBonusInsert = Omit<CreditCardWelcomeBonus, 'id' | 'created_at' | 'updated_at'>
export type ProgramTransferInsert   = Omit<ProgramTransfer, 'id' | 'created_at' | 'updated_at'>

// ─── Admin Refresh Queue ─────────────────────────────────────────────────
// Backed by the `admin_refresh_queue` view created in migration 048.
// Cadences mirrored in lib/admin/refresh-cadences.ts.

export interface RefreshQueueItem {
  entity_type: string  // 'credit_card' | 'credit_card_welcome_bonus' | 'issuer' | `program_${string}` | 'hotel_properties_program'
  entity_id: string
  entity_slug: string
  entity_name: string
  last_verified: string | null
  cadence_days: number
  age_days: number
  edit_url: string
}

/**
 * Fetch all stale-content entities flagged by the admin_refresh_queue view.
 * Sorted by age_days descending (oldest first), then entity_name asc as tiebreak.
 * Optionally filter by entity_type (e.g. 'credit_card' to see only card rows).
 */
export async function getRefreshQueue(
  supabase: SupabaseClient,
  options: { entityType?: string; limit?: number } = {},
): Promise<RefreshQueueItem[]> {
  let query = supabase
    .from('admin_refresh_queue')
    .select('*')
    .order('age_days', { ascending: false })
    .order('entity_name', { ascending: true })

  if (options.entityType) {
    query = query.eq('entity_type', options.entityType)
  }
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as RefreshQueueItem[]
}

/**
 * Lightweight count for the admin nav badge. Cached (revalidate=60) so the
 * badge doesn't hit the DB on every admin page navigation.
 */
export async function getRefreshQueueCount(
  supabase: SupabaseClient,
): Promise<number> {
  const { count, error } = await supabase
    .from('admin_refresh_queue')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

/**
 * Group the queue by entity_type for the UI's filter chips and category counts.
 */
export async function getRefreshQueueByType(
  supabase: SupabaseClient,
): Promise<Record<string, number>> {
  const items = await getRefreshQueue(supabase)
  const counts: Record<string, number> = {}
  for (const item of items) {
    counts[item.entity_type] = (counts[item.entity_type] ?? 0) + 1
  }
  return counts
}

// ─── Unified Extractions Hub ─────────────────────────────────────────────
// Backed by admin_extractions_browse view (migration 272). Lists every
// extractable entity in the system, not just stale ones.

export interface ExtractionsBrowseItem {
  entity_type: string
  entity_id: string
  entity_slug: string
  entity_name: string
  last_verified: string | null
  cadence_days: number
  age_days: number
  edit_url: string
  extract_url: string | null
}

/**
 * Fetch every extractable entity (cards, programs, issuers, welcome bonuses,
 * hotel-property rollups). Sorted by age_days desc (oldest first), then name.
 */
export async function getExtractionsBrowse(
  supabase: SupabaseClient,
  options: { entityType?: string } = {},
): Promise<ExtractionsBrowseItem[]> {
  let query = supabase
    .from('admin_extractions_browse')
    .select('*')
    .order('age_days', { ascending: false })
    .order('entity_name', { ascending: true })

  if (options.entityType) {
    query = query.eq('entity_type', options.entityType)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ExtractionsBrowseItem[]
}

export interface RecentExtractionItem {
  id: string
  kind: 'program' | 'card'
  entity_slug: string
  entity_name: string
  status: string
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  cost_usd: number | null
  error_message: string | null
  created_at: string
  applied_count: number
  skipped_count: number
  extract_url: string
}

/**
 * Recent extraction history (last N), merging program_extractions +
 * credit_card_extractions. Used in the bottom section of /admin/extractions.
 */
export async function getRecentExtractions(
  supabase: SupabaseClient,
  limit = 50,
): Promise<RecentExtractionItem[]> {
  const [progRes, cardRes] = await Promise.all([
    supabase
      .from('program_extractions')
      .select(`
        id, status, model, input_tokens, output_tokens, cost_usd,
        error_message, created_at, applied_fields,
        program:programs!inner(slug, name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('credit_card_extractions')
      .select(`
        id, status, model, input_tokens, output_tokens, cost_usd,
        error_message, created_at,
        card:credit_cards!inner(slug, name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  type ProgRow = {
    id: string
    status: string
    model: string | null
    input_tokens: number | null
    output_tokens: number | null
    cost_usd: number | null
    error_message: string | null
    created_at: string
    applied_fields: Record<string, string> | null
    program: { slug: string; name: string } | { slug: string; name: string }[] | null
  }
  type CardRow = {
    id: string
    status: string
    model: string | null
    input_tokens: number | null
    output_tokens: number | null
    cost_usd: number | null
    error_message: string | null
    created_at: string
    card: { slug: string; name: string } | { slug: string; name: string }[] | null
  }

  const progRows: RecentExtractionItem[] = ((progRes.data ?? []) as ProgRow[]).map((r) => {
    const prog = Array.isArray(r.program) ? r.program[0] : r.program
    const applied = r.applied_fields ?? {}
    let appliedCount = 0
    let skippedCount = 0
    for (const v of Object.values(applied)) {
      if (v === 'applied' || v === 'edited') appliedCount++
      else if (v === 'skipped') skippedCount++
    }
    return {
      id: r.id,
      kind: 'program',
      entity_slug: prog?.slug ?? '',
      entity_name: prog?.name ?? '—',
      status: r.status,
      model: r.model,
      input_tokens: r.input_tokens,
      output_tokens: r.output_tokens,
      cost_usd: r.cost_usd,
      error_message: r.error_message,
      created_at: r.created_at,
      applied_count: appliedCount,
      skipped_count: skippedCount,
      extract_url: `/admin/programs/${prog?.slug}/extract`,
    }
  })

  const cardRows: RecentExtractionItem[] = ((cardRes.data ?? []) as CardRow[]).map((r) => {
    const card = Array.isArray(r.card) ? r.card[0] : r.card
    return {
      id: r.id,
      kind: 'card',
      entity_slug: card?.slug ?? '',
      entity_name: card?.name ?? '—',
      status: r.status,
      model: r.model,
      input_tokens: r.input_tokens,
      output_tokens: r.output_tokens,
      cost_usd: r.cost_usd,
      error_message: r.error_message,
      created_at: r.created_at,
      applied_count: 0,
      skipped_count: 0,
      extract_url: `/admin/cards/${card?.slug}/extract`,
    }
  })

  return [...progRows, ...cardRows]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
}

/**
 * "Cards that earn into me" — given a program (e.g. Hyatt), returns:
 *   1. Direct co-brand cards (where co_brand_program_id = this program)
 *   2. Cards whose currency_program transfers to this program via program_transfers
 *
 * Returns a flat list with a `relationship` discriminator. Sorted: direct
 * co-brands first, then by annual_fee_usd asc.
 *
 * Note: program_transfers is empty until the JSONB-to-table backfill runs.
 * Until then this only surfaces direct co-brands. Transfer-partner cards
 * appear automatically once the backfill lands — no UI changes needed.
 */
export interface CardThatEarnsIn {
  card: CreditCard
  issuer: Pick<Issuer, 'slug' | 'name'>
  relationship: 'direct_co_brand' | 'transfer_partner'
  current_welcome_bonus: Pick<CreditCardWelcomeBonus, 'bonus_amount' | 'bonus_currency' | 'estimated_value_usd'> | null
}

export async function getCardsThatEarnIntoProgram(
  supabase: SupabaseClient,
  programId: string,
): Promise<CardThatEarnsIn[]> {
  const { data: directCards, error: directError } = await supabase
    .from('credit_cards')
    .select('*, issuer:issuers!issuer_id(slug, name)')
    .eq('co_brand_program_id', programId)
    .eq('is_active', true)
  if (directError) throw directError

  const { data: transferRows } = await supabase
    .from('program_transfers')
    .select('from_program_id')
    .eq('to_program_id', programId)

  const transferableCurrencyIds = (transferRows ?? []).map((r: { from_program_id: string }) => r.from_program_id)

  let transferCards: Array<CreditCard & { issuer: Pick<Issuer, 'slug' | 'name'> }> = []
  if (transferableCurrencyIds.length > 0) {
    const { data: tCards, error: tErr } = await supabase
      .from('credit_cards')
      .select('*, issuer:issuers!issuer_id(slug, name)')
      .in('currency_program_id', transferableCurrencyIds)
      .eq('is_active', true)
    if (tErr) throw tErr
    transferCards = (tCards ?? []) as Array<CreditCard & { issuer: Pick<Issuer, 'slug' | 'name'> }>
  }

  const allCards = [
    ...((directCards ?? []) as Array<CreditCard & { issuer: Pick<Issuer, 'slug' | 'name'> }>),
    ...transferCards,
  ]
  const cardIds = allCards.map((c) => c.id)

  const subsByCardId = new Map<string, Pick<CreditCardWelcomeBonus, 'bonus_amount' | 'bonus_currency' | 'estimated_value_usd'>>()
  if (cardIds.length > 0) {
    const { data: subs } = await supabase
      .from('credit_card_welcome_bonuses')
      .select('card_id, bonus_amount, bonus_currency, estimated_value_usd')
      .in('card_id', cardIds)
      .eq('is_current', true)
    for (const s of (subs ?? []) as Array<{ card_id: string } & Pick<CreditCardWelcomeBonus, 'bonus_amount' | 'bonus_currency' | 'estimated_value_usd'>>) {
      subsByCardId.set(s.card_id, {
        bonus_amount: s.bonus_amount,
        bonus_currency: s.bonus_currency,
        estimated_value_usd: s.estimated_value_usd,
      })
    }
  }

  const seen = new Set<string>()
  const result: CardThatEarnsIn[] = []

  for (const card of (directCards ?? []) as Array<CreditCard & { issuer: Pick<Issuer, 'slug' | 'name'> }>) {
    if (seen.has(card.id)) continue
    seen.add(card.id)
    const { issuer, ...rest } = card
    result.push({
      card: rest as CreditCard,
      issuer,
      relationship: 'direct_co_brand',
      current_welcome_bonus: subsByCardId.get(card.id) ?? null,
    })
  }
  for (const card of transferCards) {
    if (seen.has(card.id)) continue
    seen.add(card.id)
    const { issuer, ...rest } = card
    result.push({
      card: rest as CreditCard,
      issuer,
      relationship: 'transfer_partner',
      current_welcome_bonus: subsByCardId.get(card.id) ?? null,
    })
  }

  result.sort((a, b) => {
    if (a.relationship !== b.relationship) {
      return a.relationship === 'direct_co_brand' ? -1 : 1
    }
    const aFee = a.card.annual_fee_usd ?? Number.POSITIVE_INFINITY
    const bFee = b.card.annual_fee_usd ?? Number.POSITIVE_INFINITY
    return aFee - bFee
  })

  return result
}

export interface CardDetailBundle {
  card: CreditCard
  issuer: Issuer
  currency_program: { slug: string; name: string } | null
  co_brand_program: { slug: string; name: string } | null
  earn_rates: CreditCardEarnRate[]
  benefits: CreditCardBenefit[]
  current_welcome_bonus: CreditCardWelcomeBonus | null
  /** Other active cards on the same currency program with the OPPOSITE
   * transferable flag. Used to render the family-pairing alert:
   *   - On a transferable card: lists non-transferable siblings ("pool from these")
   *   - On a non-transferable card: lists transferable siblings ("move points to one of these to unlock")
   * Empty array when no siblings exist (or no currency program). */
  sibling_cards_opposite_transfer: Array<{ slug: string; name: string; points_transferable_to_partners: boolean }>
}

export async function getCardDetailBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<CardDetailBundle | null> {
  const { data: card, error: cardError } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (cardError) throw cardError
  if (!card) return null
  const c = card as CreditCard

  const [issuerRes, currencyRes, coBrandRes, earnRatesRes, benefitsRes, subRes] = await Promise.all([
    supabase.from('issuers').select('*').eq('id', c.issuer_id).single(),
    c.currency_program_id
      ? supabase.from('programs').select('slug, name').eq('id', c.currency_program_id).maybeSingle()
      : Promise.resolve({ data: null, error: null } as { data: { slug: string; name: string } | null; error: null }),
    c.co_brand_program_id
      ? supabase.from('programs').select('slug, name').eq('id', c.co_brand_program_id).maybeSingle()
      : Promise.resolve({ data: null, error: null } as { data: { slug: string; name: string } | null; error: null }),
    supabase.from('credit_card_earn_rates').select('*').eq('card_id', c.id).order('multiplier', { ascending: false }),
    supabase.from('credit_card_benefits').select('*').eq('card_id', c.id).order('sort_order', { ascending: true }),
    supabase.from('credit_card_welcome_bonuses').select('*').eq('card_id', c.id).eq('is_current', true).maybeSingle(),
  ])

  if (issuerRes.error) throw issuerRes.error
  if (earnRatesRes.error) throw earnRatesRes.error
  if (benefitsRes.error) throw benefitsRes.error

  // Sibling cards on the same currency program with the OPPOSITE transferable
  // flag. Drives the family-pairing alert on the detail page (Freedom Rise →
  // links to Sapphire/Ink Preferred; Sapphire Preferred → lists Freedom +
  // Ink Cash/Unlimited as pool-from candidates).
  let siblingCardsOppositeTransfer: Array<{ slug: string; name: string; points_transferable_to_partners: boolean }> = []
  if (c.currency_program_id) {
    const { data: siblings } = await supabase
      .from('credit_cards')
      .select('slug, name, points_transferable_to_partners')
      .eq('currency_program_id', c.currency_program_id)
      .eq('is_active', true)
      .neq('id', c.id)
      .eq('points_transferable_to_partners', !c.points_transferable_to_partners)
      .order('annual_fee_usd', { ascending: true, nullsFirst: true })
    siblingCardsOppositeTransfer = (siblings ?? []) as Array<{
      slug: string
      name: string
      points_transferable_to_partners: boolean
    }>
  }

  return {
    card: c,
    issuer: issuerRes.data as Issuer,
    currency_program: currencyRes.data as { slug: string; name: string } | null,
    co_brand_program: coBrandRes.data as { slug: string; name: string } | null,
    earn_rates: (earnRatesRes.data ?? []) as CreditCardEarnRate[],
    benefits: (benefitsRes.data ?? []) as CreditCardBenefit[],
    current_welcome_bonus: subRes.data as CreditCardWelcomeBonus | null,
    sibling_cards_opposite_transfer: siblingCardsOppositeTransfer,
  }
}

// ─── Partner Redemptions ─────────────────────────────────────────────────────
export type RedemptionCabin = 'Economy' | 'Premium Economy' | 'Business' | 'First'
export type PricingModel = 'fixed' | 'dynamic' | 'hybrid'
export type RedemptionConfidence = 'HIGH' | 'MED' | 'LOW'

export type FuelSurchargeLevel = 'none' | 'low' | 'high'

export interface PartnerRedemption {
  id: string
  created_at: string
  updated_at: string
  currency_program_id: string
  operating_carrier_id: string
  cabin: RedemptionCabin
  region_or_route: string
  cost_miles_low: number | null
  cost_miles_high: number | null
  pricing_model: PricingModel
  notes: string | null
  confidence: RedemptionConfidence
  last_verified: string | null
  is_active: boolean
  // Ways To Book additions (migration 070).
  fuel_surcharges: FuelSurchargeLevel | null
  bookable_online: boolean | null
  booking_channel: string | null
  requires_saver_space: boolean | null
  non_saver_fallback: string | null
  routing_rules: string | null
  teach_caption: string | null
  verified_by: string | null
  // Cash-fee additions (migration 080).
  cash_fee_low: number | null
  cash_fee_high: number | null
  fees_note: string | null
  // Hub-tool additions (migration 083).
  complexity_score: 'easy' | 'annoying' | 'nerd_stuff' | null
  what_breaks_this: string | null
  devalued_at: string | null
  devaluation_note: string | null
  availability_reality: 'excellent' | 'good' | 'mixed' | 'rare' | 'unicorn' | null
  route_buckets: string[] | null
  // Phase 1 of Award Chart Rebuild (migration 227): IATA anchors for
  // chart-computed route-level pricing on Don't Sleep / Should I Transfer /
  // Where Can I Go surfaces. Null on bucket-level rows.
  origin_iata: string | null
  dest_iata: string | null
}

export type PartnerRedemptionInsert = Omit<
  PartnerRedemption,
  'id' | 'created_at' | 'updated_at'
>

/** Joined shape used by admin list and public surfaces. */
export interface PartnerRedemptionWithPrograms extends PartnerRedemption {
  currency_program: {
    slug: string
    name: string
    alliance: Alliance | null
    /** Optional — official program chart URL. When populated, surfaces
     *  as a "View official chart →" link on the SweetSpotCard so readers
     *  can verify the rate at the source. Curator policy: official
     *  program page only — no blogs or aggregators. */
    partner_chart_url?: string | null
  } | null
  operating_carrier: { slug: string; name: string; alliance: Alliance | null } | null
}

export async function getAllPartnerRedemptions(
  supabase: SupabaseClient
): Promise<PartnerRedemptionWithPrograms[]> {
  const { data, error } = await supabase
    .from('partner_redemptions')
    .select(`
      *,
      currency_program:programs!partner_redemptions_currency_program_id_fkey(slug, name, alliance),
      operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(slug, name, alliance)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as PartnerRedemptionWithPrograms[]
}

export async function getPartnerRedemptionsByCurrency(
  supabase: SupabaseClient,
  currency_program_id: string
): Promise<PartnerRedemptionWithPrograms[]> {
  const { data, error } = await supabase
    .from('partner_redemptions')
    .select(`
      *,
      currency_program:programs!partner_redemptions_currency_program_id_fkey(slug, name, alliance),
      operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(slug, name, alliance)
    `)
    .eq('currency_program_id', currency_program_id)
    .eq('is_active', true)
    .order('cabin')
    .order('cost_miles_low', { nullsFirst: false })
  if (error) throw error
  return (data ?? []) as unknown as PartnerRedemptionWithPrograms[]
}

export async function getPartnerRedemptionsByOperatingCarrier(
  supabase: SupabaseClient,
  operating_carrier_id: string
): Promise<PartnerRedemptionWithPrograms[]> {
  const { data, error } = await supabase
    .from('partner_redemptions')
    .select(`
      *,
      currency_program:programs!partner_redemptions_currency_program_id_fkey(slug, name, alliance),
      operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(slug, name, alliance)
    `)
    .eq('operating_carrier_id', operating_carrier_id)
    .eq('is_active', true)
    .order('cabin')
    .order('cost_miles_low', { nullsFirst: false })
  if (error) throw error
  return (data ?? []) as unknown as PartnerRedemptionWithPrograms[]
}

export async function createPartnerRedemption(
  supabase: SupabaseClient,
  input: PartnerRedemptionInsert
): Promise<PartnerRedemption> {
  const { data, error } = await supabase
    .from('partner_redemptions')
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data as PartnerRedemption
}

export async function updatePartnerRedemption(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<PartnerRedemptionInsert>
): Promise<PartnerRedemption> {
  const { data, error } = await supabase
    .from('partner_redemptions')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as PartnerRedemption
}

export async function deletePartnerRedemption(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('partner_redemptions').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Resources nav (Phase 3) — counts + index listing
// ---------------------------------------------------------------------------

export type ResourceCategory = 'airline' | 'hotel' | 'alliance' | 'credit_card'

export type ResourceNavCounts = Record<ResourceCategory, number>

const RESOURCE_TYPE_FILTER: Record<ResourceCategory, ProgramType[]> = {
  // Atmos sits in `loyalty_program` but reads as an airline FF program; group it.
  airline: ['airline', 'loyalty_program'],
  hotel: ['hotel'],
  alliance: ['alliance'],
  credit_card: ['credit_card'],
}

/**
 * Counts of programs with curated content per Resources-nav category.
 * Drives the dropdown auto-link: > 0 → linked, 0 → greyed out.
 */
export async function getResourceNavCounts(
  supabase: SupabaseClient
): Promise<ResourceNavCounts> {
  const entries = await Promise.all(
    (Object.keys(RESOURCE_TYPE_FILTER) as ResourceCategory[]).map(async (cat) => {
      const { count, error } = await supabase
        .from('programs')
        .select('id', { count: 'exact', head: true })
        .in('type', RESOURCE_TYPE_FILTER[cat])
        .not('content_updated_at', 'is', null)
      if (error) throw error
      return [cat, count ?? 0] as const
    })
  )
  return Object.fromEntries(entries) as ResourceNavCounts
}

export interface ResourceCard {
  id: string
  slug: string
  name: string
  type: ProgramType
  alliance: Alliance | null
  hubs: string[] | null
  contentUpdatedAt: string | null
  transferPartnerCount: number
  alertCount: number
  /** Member airline count for alliance rows. Null for non-alliance categories. */
  memberCount: number | null
  /**
   * For carrier rows in a joint loyalty program (e.g. Alaska/Hawaiian → Atmos,
   * Air France/KLM → Flying Blue): pointer to the loyalty program where
   * transfer partners and status content live. Null when the program holds
   * its own currency (Delta, United, AA).
   */
  joinedLoyaltyProgram: { slug: string; name: string } | null
  /**
   * Distinct operating-carrier programs that this currency can be redeemed
   * on (derived from partner_redemptions table). Surfaces bilateral
   * partnerships (e.g. JetBlue → United via Blue Sky) on the card / hero
   * even when the program isn't in a traditional alliance. Empty array if
   * no partner_redemptions rows are seeded for this program.
   */
  partners: { slug: string; name: string }[]
  /**
   * Active published promo_rewards count for this program — used by the
   * /programs index tile to surface "X promo routes live this month"
   * when the scraper has flowed data through.
   */
  promoCount: number
}

/**
 * Bulk-fetch distinct operating-carrier partners for a list of currency program IDs.
 * Used to surface partner pills on program cards / hero without N+1 queries.
 */
export async function getPartnersByProgramIds(
  supabase: SupabaseClient,
  programIds: string[]
): Promise<Map<string, { slug: string; name: string }[]>> {
  const out = new Map<string, { slug: string; name: string }[]>()
  if (programIds.length === 0) return out
  const { data, error } = await supabase
    .from('partner_redemptions')
    .select(`
      currency_program_id,
      operating_carrier:programs!partner_redemptions_operating_carrier_id_fkey(slug, name)
    `)
    .in('currency_program_id', programIds)
    .eq('is_active', true)
  if (error) throw error
  const seen = new Map<string, Set<string>>()
  // Supabase types FK-aliased relations as arrays even for single-FK joins,
  // so we cast to unknown first then narrow. Same pattern used by
  // getAllPartnerRedemptions / getPartnerRedemptionsByCurrency above.
  const rows = (data ?? []) as unknown as Array<{
    currency_program_id: string
    operating_carrier: { slug: string; name: string } | { slug: string; name: string }[] | null
  }>
  for (const row of rows) {
    // Normalize: take first element if Supabase returned an array, else use as-is.
    const carrier = Array.isArray(row.operating_carrier)
      ? row.operating_carrier[0] ?? null
      : row.operating_carrier
    if (!carrier) continue
    if (!seen.has(row.currency_program_id)) {
      seen.set(row.currency_program_id, new Set())
      out.set(row.currency_program_id, [])
    }
    const slugSet = seen.get(row.currency_program_id)!
    if (slugSet.has(carrier.slug)) continue
    slugSet.add(carrier.slug)
    out.get(row.currency_program_id)!.push(carrier)
  }
  // Sort each list alphabetically by name
  for (const list of out.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }
  return out
}

/**
 * List programs to display on /programs?type=<category>. Only returns
 * programs with curated content. Sorted alphabetically.
 *
 * @param allianceFilter Optional — when set (and category === 'airline'),
 * narrows results to programs in that alliance. Used by the airlines tab
 * filter chips.
 */
export async function listProgramsForIndex(
  supabase: SupabaseClient,
  category: ResourceCategory,
  allianceFilter?: Alliance | null
): Promise<ResourceCard[]> {
  let query = supabase
    .from('programs')
    .select('id, slug, name, type, alliance, hubs, content_updated_at, transfer_partners, parent_program_slug, member_programs')
    .in('type', RESOURCE_TYPE_FILTER[category])
    .not('content_updated_at', 'is', null)
    .order('name', { ascending: true })

  if (allianceFilter && category === 'airline') {
    query = query.eq('alliance', allianceFilter)
  }

  const { data: programs, error } = await query

  if (error) throw error
  const rows = (programs ?? []) as Array<
    Pick<Program, 'id' | 'slug' | 'name' | 'type' | 'alliance' | 'hubs' | 'content_updated_at' | 'transfer_partners' | 'parent_program_slug' | 'member_programs'>
  >
  if (rows.length === 0) return []

  // For carrier rows pointing at a joint loyalty program, look up the
  // loyalty program's display name to render "Loyalty program: Atmos →".
  const slugsByName = new Map(rows.map((r) => [r.slug, r.name]))

  // Active alert counts per program via alert_programs junction.
  const { data: links, error: linkError } = await supabase
    .from('alert_programs')
    .select('program_id, alerts!inner(status)')
    .in(
      'program_id',
      rows.map((r) => r.id)
    )
    .eq('alerts.status', 'published')

  if (linkError) throw linkError
  const alertCounts = new Map<string, number>()
  for (const link of (links ?? []) as Array<{ program_id: string }>) {
    alertCounts.set(link.program_id, (alertCounts.get(link.program_id) ?? 0) + 1)
  }

  // Bulk-fetch partner_redemptions partners for every row so we can show
  // bilateral-partnership pills on cards (esp. for alliance:'other' programs
  // like JetBlue where the alliance pill is suppressed).
  const partnersByProgramId = await getPartnersByProgramIds(supabase, rows.map((r) => r.id))

  // Active published promo_rewards count per program — for "X promo routes
  // live this month" on the listing tile. Filters to published + active
  // + non-expired in one trip.
  const today = new Date().toISOString().slice(0, 10)
  const { data: promoRows } = await supabase
    .from('promo_rewards')
    .select('program_id')
    .in('program_id', rows.map((r) => r.id))
    .eq('admin_status', 'published')
    .eq('last_seen_active', true)
    .or(`valid_to.gte.${today},valid_to.is.null`)
  const promoCounts = new Map<string, number>()
  for (const row of (promoRows ?? []) as Array<{ program_id: string }>) {
    promoCounts.set(row.program_id, (promoCounts.get(row.program_id) ?? 0) + 1)
  }

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    type: r.type,
    alliance: r.alliance,
    hubs: r.hubs,
    contentUpdatedAt: r.content_updated_at,
    transferPartnerCount: Array.isArray(r.transfer_partners) ? r.transfer_partners.length : 0,
    alertCount: alertCounts.get(r.id) ?? 0,
    memberCount:
      category === 'alliance' && Array.isArray(r.member_programs)
        ? r.member_programs.length
        : null,
    joinedLoyaltyProgram:
      r.parent_program_slug && slugsByName.has(r.parent_program_slug)
        ? { slug: r.parent_program_slug, name: slugsByName.get(r.parent_program_slug)! }
        : null,
    partners: partnersByProgramId.get(r.id) ?? [],
    promoCount: promoCounts.get(r.id) ?? 0,
  }))
}
