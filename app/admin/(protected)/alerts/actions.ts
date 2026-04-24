'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import {
  updateAlert,
  expireAlert,
  incrementSourceApproved,
  getAlertById,
  setAlertPrograms,
  logSystemError,
} from '@/utils/supabase/queries'
import type { Alert, AlertStatus } from '@/utils/supabase/queries'
import type { SupabaseClient } from '@supabase/supabase-js'
import { writeAlertDraft } from '@/utils/ai/writeAlertDraft'
import { verifyAlertDraft, webVerifyClaims, type VerifyClaim } from '@/utils/ai/verifyAlertDraft'

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

export interface RegenerateResult {
  ok: boolean
  error?: string
  verdictCounts?: { likely_correct: number; likely_wrong: number; unverifiable: number; supported: number }
}

// Re-runs the stager (writeAlertDraft + program tagging + fact-check) against
// the original intel raw_text using current rules. Overwrites title/summary/
// description/action_type/dates/programs and appends a 'regenerate' entry to
// revision_log with the prior copy so you can eyeball before/after.
export async function regenerateAlertDraftAction(alertId: string): Promise<RegenerateResult> {
  const supabase = createAdminClient()

  const { data: alert, error: alertErr } = await supabase
    .from('alerts')
    .select('id, title, summary, description, source_url, source_intel_id, revision_log')
    .eq('id', alertId)
    .maybeSingle()
  if (alertErr || !alert) return { ok: false, error: alertErr?.message ?? 'alert not found' }
  if (!alert.source_intel_id) return { ok: false, error: 'alert has no source_intel_id — cannot regenerate' }

  const [intelRes, programsRes, recentRes] = await Promise.all([
    supabase
      .from('intel_items')
      .select('id, headline, raw_text, source_name, source_url, alert_type, programs')
      .eq('id', alert.source_intel_id as string)
      .maybeSingle(),
    supabase.from('programs').select('id, slug, name, type'),
    supabase
      .from('alerts')
      .select('title, summary')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3),
  ])

  if (intelRes.error || !intelRes.data) {
    return { ok: false, error: intelRes.error?.message ?? 'intel_item not found' }
  }
  if (programsRes.error) return { ok: false, error: programsRes.error.message }

  const intel = intelRes.data
  const allPrograms = (programsRes.data ?? []).map((p) => ({
    id: p.id as string,
    slug: p.slug as string,
    name: p.name as string,
    type: p.type as string,
  }))
  const programBySlug = new Map(allPrograms.map((p) => [p.slug, p]))
  const recentSamples = (recentRes.data ?? []).map((r) => ({
    title: (r.title as string) ?? '',
    summary: (r.summary as string) ?? '',
  }))

  let draft
  try {
    draft = await writeAlertDraft({
      intel: {
        intel_id: intel.id as string,
        headline: intel.headline as string,
        raw_text: (intel.raw_text as string | null) ?? null,
        source_name: intel.source_name as string,
        source_url: (intel.source_url as string | null) ?? null,
        alert_type: intel.alert_type,
        programs: intel.programs as string[] | null,
      },
      programs: allPrograms,
      recent_samples: recentSamples,
    })
  } catch (err) {
    await logSystemError(supabase, 'alerts:regenerate:writeDraft', err, { alert_id: alertId })
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
  if (!draft) return { ok: false, error: 'writeAlertDraft returned null' }

  const primaryId = draft.primary_program_slug
    ? programBySlug.get(draft.primary_program_slug)?.id ?? null
    : null
  const secondaryIds = draft.secondary_program_slugs
    .map((s) => programBySlug.get(s)?.id)
    .filter((x): x is string => typeof x === 'string')

  const existingLog = Array.isArray(alert.revision_log)
    ? (alert.revision_log as Array<Record<string, unknown>>)
    : []
  const nextIter = existingLog.reduce((m, e) => Math.max(m, (e.iter as number | undefined) ?? 0), 0) + 1
  const regenEntry = {
    iter: nextIter,
    kind: 'regenerate' as const,
    at: new Date().toISOString(),
    prev: {
      title: (alert.title as string) ?? '',
      summary: (alert.summary as string) ?? '',
      description: (alert.description as string | null) ?? null,
    },
  }

  try {
    await updateAlert(supabase, alertId, {
      title: draft.title,
      summary: draft.summary,
      description: draft.description,
      action_type: draft.action_type,
      primary_program_id: primaryId,
      start_date: draft.start_date,
      end_date: draft.end_date,
      revision_log: [...existingLog, regenEntry],
    })
    await setAlertPrograms(supabase, alertId, secondaryIds)
  } catch (err) {
    await logSystemError(supabase, 'alerts:regenerate:persist', err, { alert_id: alertId })
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  let finalClaims: VerifyClaim[] = []
  let checkedAt: string | null = null
  try {
    const verify = await verifyAlertDraft({
      draft: { title: draft.title, summary: draft.summary, description: draft.description },
      raw_text: (intel.raw_text as string | null) ?? null,
      source_url: (intel.source_url as string | null) ?? null,
    })
    if (verify) {
      finalClaims = verify.claims
      checkedAt = verify.checked_at
      if (finalClaims.some((c) => !c.supported)) {
        try {
          finalClaims = await webVerifyClaims({
            claims: finalClaims,
            context: { title: draft.title, source_url: (intel.source_url as string | null) ?? null },
          })
        } catch (err) {
          await logSystemError(supabase, 'alerts:regenerate:webVerify', err, { alert_id: alertId })
          finalClaims = finalClaims.map((c) =>
            c.supported
              ? c
              : { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
          )
        }
      }
      await updateAlert(supabase, alertId, {
        fact_check_claims: finalClaims,
        fact_check_at: checkedAt,
      })
    }
  } catch (err) {
    await logSystemError(supabase, 'alerts:regenerate:verify', err, { alert_id: alertId })
  }

  const verdictCounts = { likely_correct: 0, likely_wrong: 0, unverifiable: 0, supported: 0 }
  for (const c of finalClaims) {
    if (c.supported) verdictCounts.supported++
    else if (c.web_verdict === 'likely_correct') verdictCounts.likely_correct++
    else if (c.web_verdict === 'likely_wrong') verdictCounts.likely_wrong++
    else verdictCounts.unverifiable++
  }

  revalidatePath('/admin/alerts')
  revalidatePath(`/admin/alerts/${alertId}/edit`)
  return { ok: true, verdictCounts }
}

export async function expireAlertAction(id: string) {
  const supabase = createAdminClient()
  await expireAlert(supabase, id)
  redirect('/admin/alerts')
}
