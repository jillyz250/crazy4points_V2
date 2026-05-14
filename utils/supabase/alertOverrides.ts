/**
 * Server-side helpers for the alert gate-override audit log
 * (alert_overrides table, migration 266).
 *
 * Every admin gate-bypass (T&Cs missing, fact-check chips dismissed, voice
 * check failed) must record a reason. This is the audit trail.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type OverrideGate = 'tnc' | 'factcheck' | 'voice'

export interface AlertOverrideRow {
  id: string
  alert_id: string
  gate: OverrideGate
  reason: string
  overridden_by: string | null
  overridden_at: string
}

export interface LogAlertOverrideInput {
  alertId: string
  gate: OverrideGate
  reason: string
  overriddenBy?: string | null
}

export async function logAlertOverride(
  supabase: SupabaseClient,
  input: LogAlertOverrideInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const reason = input.reason.trim()
  if (reason.length === 0) {
    return { ok: false, error: 'override reason is required' }
  }
  const { error } = await supabase.from('alert_overrides').insert({
    alert_id: input.alertId,
    gate: input.gate,
    reason,
    overridden_by: input.overriddenBy ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getAlertOverrides(
  supabase: SupabaseClient,
  alertId: string
): Promise<AlertOverrideRow[]> {
  const { data } = await supabase
    .from('alert_overrides')
    .select('id, alert_id, gate, reason, overridden_by, overridden_at')
    .eq('alert_id', alertId)
    .order('overridden_at', { ascending: false })
  return (data ?? []) as AlertOverrideRow[]
}
