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
  | 'expired'

export type AlertActionType = 'book' | 'transfer' | 'apply' | 'monitor' | 'learn'

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export type ProgramType =
  | 'credit_card'
  | 'airline'
  | 'hotel'
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
  created_at: string
  updated_at: string
}

export type SourceWithFeedCount = Source & { feed_count: number }

export interface Alert {
  id: string
  slug: string
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
  registration_required: boolean
  created_by: string | null
  approved_by: string | null
  last_verified: string | null
  created_at: string
  updated_at: string
}

export interface Program {
  id: string
  slug: string
  name: string
  type: ProgramType
  tier: string | null
  monitor_tier: MonitorTier | null
  is_active: boolean
  description: string | null
  logo_url: string | null
  program_url: string | null
  notes: string | null
  last_verified: string | null
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

export interface HomepageSlot {
  id: string
  slot_number: number
  alert_id: string | null
  is_pinned: boolean
  pinned_at: string | null
  pinned_by: string | null
  created_at: string
  updated_at: string
}

export type AlertWithPrograms = Alert & {
  alert_programs: (AlertProgram & { programs: Program })[]
}

export type HomepageSlotWithAlert = HomepageSlot & {
  alerts: Alert | null
}

export type AlertInsert = Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'computed_score' | 'score_last_computed_at'>
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

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch all non-expired, published alerts ordered by soonest expiry then
 * highest computed score.
 */
export async function getActiveAlerts(supabase: SupabaseClient): Promise<Alert[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('status', 'published' satisfies AlertStatus)
    .or(`end_date.is.null,end_date.gt.${now}`)
    .order('end_date', { ascending: true, nullsFirst: false })
    .order('computed_score', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data as Alert[]
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
 * Fetch all homepage_slots that have an alert assigned, ordered by slot
 * number, including the full alert record.
 */
export async function getHomepageAlerts(
  supabase: SupabaseClient
): Promise<HomepageSlotWithAlert[]> {
  const { data, error } = await supabase
    .from('homepage_slots')
    .select(`
      *,
      alerts (*)
    `)
    .not('alert_id', 'is', null)
    .order('slot_number', { ascending: true })

  if (error) throw error
  return data as HomepageSlotWithAlert[]
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
 * Fetch a single published alert by slug.
 */
export async function getAlertBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published' satisfies AlertStatus)
    .single()

  if (error) throw error
  return data as Alert
}

/**
 * Fetch active (published, not expired) alerts with optional type and
 * primary_program_id filters. Used by the public /alerts listing page.
 */
export async function getActiveAlertsByFilter(
  supabase: SupabaseClient,
  type?: string | null,
  programId?: string | null
): Promise<Alert[]> {
  const now = new Date().toISOString()

  let query = supabase
    .from('alerts')
    .select('*')
    .eq('status', 'published' satisfies AlertStatus)
    .or(`end_date.is.null,end_date.gt.${now}`)

  if (type) query = query.eq('type', type)
  if (programId) query = query.eq('primary_program_id', programId)

  query = query
    .order('end_date', { ascending: true, nullsFirst: false })
    .order('computed_score', { ascending: false, nullsFirst: false })

  const { data, error } = await query
  if (error) throw error
  return data as Alert[]
}

/**
 * Fetch alerts published on a specific calendar date (UTC).
 * Used by the /daily-brief/[date] archive page.
 */
export async function getAlertsByPublishDate(
  supabase: SupabaseClient,
  dateStr: string // YYYY-MM-DD
): Promise<Alert[]> {
  const start = `${dateStr}T00:00:00.000Z`
  const end   = `${dateStr}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('status', 'published' satisfies AlertStatus)
    .gte('published_at', start)
    .lte('published_at', end)
    .order('computed_score', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data as Alert[]
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
 * Replace all alert_programs rows for an alert with the given program IDs.
 * Deletes existing rows then inserts fresh ones. Pass an empty array to clear.
 */
export async function setAlertPrograms(
  supabase: SupabaseClient,
  alertId: string,
  programIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('alert_programs')
    .delete()
    .eq('alert_id', alertId)

  if (deleteError) throw deleteError

  if (programIds.length === 0) return

  const rows = programIds.map((program_id) => ({
    alert_id: alertId,
    program_id,
    role: 'tagged',
  }))

  const { error: insertError } = await supabase
    .from('alert_programs')
    .insert(rows)

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
): Promise<{ program: Program; alerts: Alert[] }> {
  // 1. Resolve the program
  const { data: program, error: progError } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', programSlug)
    .single()

  if (progError) throw progError

  // 2. Fetch alerts via junction table
  const { data: junction, error: jError } = await supabase
    .from('alert_programs')
    .select('alert_id')
    .eq('program_id', program.id)

  if (jError) throw jError

  const junctionIds = (junction ?? []).map((r: { alert_id: string }) => r.alert_id)

  // 3. Fetch alerts by primary_program_id OR junction membership
  let query = supabase
    .from('alerts')
    .select('*')
    .eq('status', 'published' satisfies AlertStatus)
    .order('published_at', { ascending: false, nullsFirst: false })

  if (junctionIds.length > 0) {
    query = query.or(`primary_program_id.eq.${program.id},id.in.(${junctionIds.join(',')})`)
  } else {
    query = query.eq('primary_program_id', program.id)
  }

  const { data: alerts, error: alertError } = await query

  if (alertError) throw alertError

  return { program: program as Program, alerts: (alerts ?? []) as Alert[] }
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
