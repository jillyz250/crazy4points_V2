'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { updateAlert, expireAlert, incrementSourceApproved } from '@/utils/supabase/queries'
import type { VerifyClaim } from '@/utils/ai/verifyAlertDraft'

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
  await updateAlert(supabase, id, {
    status: 'published',
    published_at: new Date().toISOString(),
  })
  redirect('/admin/alerts')
}

export async function approveIntelAlertAction(id: string) {
  const supabase = createAdminClient()
  const alert = await updateAlert(supabase, id, {
    status: 'published',
    published_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
  })
  // Track approval back to the originating source (non-blocking)
  if (alert.source_intel_id) {
    await incrementSourceApproved(supabase, alert.source_intel_id).catch(() => {})
  }
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
