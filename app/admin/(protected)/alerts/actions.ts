'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import {
  updateAlert,
  expireAlert,
  incrementSourceApproved,
  getAlertById,
} from '@/utils/supabase/queries'
import type { Alert, AlertStatus } from '@/utils/supabase/queries'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VerifyClaim } from '@/utils/ai/verifyAlertDraft'

// Increment the source-approved counter whenever an alert from intel
// transitions into a published/approved state — regardless of which button
// triggered the transition. Keeps source approval metrics honest.
async function trackSourceApprovalIfNeeded(
  supabase: SupabaseClient,
  prev: Pick<Alert, 'status' | 'source_intel_id'>,
  nextStatus: AlertStatus,
) {
  if (nextStatus !== 'published') return
  if (prev.status === 'published') return
  if (!prev.source_intel_id) return
  await incrementSourceApproved(supabase, prev.source_intel_id).catch(() => {})
}

export async function acknowledgeFactCheckClaimAction(alertId: string, claimIndex: number) {
  const supabase = createAdminClient()
  const { data: alert, error } = await supabase
    .from('alerts')
    .select('fact_check_claims')
    .eq('id', alertId)
    .single()
  if (error) throw error

  const claims = Array.isArray(alert?.fact_check_claims)
    ? (alert.fact_check_claims as VerifyClaim[])
    : []
  if (claimIndex < 0 || claimIndex >= claims.length) return

  const updated = claims.map((c, i) => (i === claimIndex ? { ...c, acknowledged: true } : c))
  await updateAlert(supabase, alertId, { fact_check_claims: updated })
  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${alertId}/edit`)
}

export async function publishAlertAction(id: string) {
  const supabase = createAdminClient()
  const prev = await getAlertById(supabase, id)
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: new Date().toISOString(),
  })
  await trackSourceApprovalIfNeeded(supabase, prev, 'published')
  redirect('/admin/alerts')
}

export async function approveIntelAlertAction(id: string) {
  const supabase = createAdminClient()
  const prev = await getAlertById(supabase, id)
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
  })
  await trackSourceApprovalIfNeeded(supabase, prev, 'published')
  redirect('/admin/alerts')
}

export async function bulkApproveIntelAlertsAction(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  for (const id of ids) {
    const prev = await getAlertById(supabase, id).catch(() => null)
    if (!prev) continue
    if (prev.status === 'published') continue
    await updateAlert(supabase, id, {
      status: 'published',
      published_at: now,
      approved_at: now,
    })
    await trackSourceApprovalIfNeeded(supabase, prev, 'published')
  }
  revalidatePath('/admin/alerts')
  redirect('/admin/alerts')
}

export async function bulkRejectAlertsAction(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return
  const supabase = createAdminClient()
  for (const id of ids) {
    await updateAlert(supabase, id, { status: 'rejected' }).catch(() => {})
  }
  revalidatePath('/admin/alerts')
  redirect('/admin/alerts')
}

export async function rejectAlertAction(id: string) {
  const supabase = createAdminClient()
  await updateAlert(supabase, id, { status: 'rejected' })
  redirect('/admin/alerts')
}

export async function expireAlertAction(id: string) {
  const supabase = createAdminClient()
  await expireAlert(supabase, id)
  redirect('/admin/alerts')
}
