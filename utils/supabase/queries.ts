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

  if (error) {
    console.log('[createAlert] error:', JSON.stringify(error, null, 2))
    throw error
  }
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
